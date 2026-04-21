# Документация по backend

Документ описывает backend из папки `backend`.

## Назначение

Backend - Rust API на Axum с PostgreSQL, JWT-авторизацией, refresh tokens, Swagger UI и базовыми ручками пользователей. В текущем состоянии проект больше похож на auth/user template: в нем есть регистрация, вход, обновление токенов, профиль пользователя, создание администратора и получение пользователей с пагинацией.

## Стек

- Rust 2024 edition
- Axum 0.8
- Tokio
- SQLx + PostgreSQL
- JWT через `jsonwebtoken`
- SHA-512 hashing через `sha2` + `hex`
- Serde
- Utoipa + Swagger UI
- Tower HTTP CORS
- dotenv
- tracing + tracing-subscriber
- thiserror
- Docker Compose для PostgreSQL и pgAdmin
- Локальный proc-macro crate `macroses`

## Запуск

Рабочая директория:

```bash
cd backend
```

Поднять PostgreSQL и pgAdmin:

```bash
docker compose --env-file=.env up -d --build
```

Запуск backend:

```bash
cargo run
```

Запуск в release:

```bash
cargo run --release
```

Сборка:

```bash
cargo build
```

Проверка:

```bash
cargo check
```

Форматирование:

```bash
cargo fmt
```

Линтер:

```bash
cargo clippy
```

В `Notes.md` также упоминается удобный запуск через `cargo watch`:

```bash
cargo watch -x "run --release" --env-file=.env
```

## Переменные окружения

Конфиг читается в `src/config.rs` через `Config::from_env()`.

Обязательные переменные:

```env
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_SECRET_REFRESH=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
POSTGRES_PORT=...
```

`DATABASE_URL`, `JWT_SECRET` и `JWT_SECRET_REFRESH` нужны самому приложению.

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` и `POSTGRES_PORT` используются `docker-compose.yml`.

## Адреса

Приложение слушает:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

OpenAPI JSON:

```text
http://127.0.0.1:8000/api-docs/openapi.json
```

pgAdmin из docker-compose:

```text
http://localhost:80
```

Данные pgAdmin по умолчанию:

```text
email: admin@admin.com
password: admin
```

## Структура

```text
backend/
  db/init-scripts/       SQL-скрипты инициализации БД
  macroses/              локальный proc-macro crate
  src/
    config.rs            env-конфиг, db pool, AppState
    errors/              типы ошибок и IntoResponse
    handlers/            HTTP handlers и router-ы
    middlewares/         auth и role middleware
    models/              внутренние модели
    repositories/        SQLx-репозитории
    routes.rs            сборка router-ов и Swagger
    schemas/             request/response DTO
    services/            auth services, токены, hashing
    traicing.rs          настройка tracing
    main.rs              точка входа
  Cargo.toml
  Dockerfile
  docker-compose.yml
  Notes.md
```

## Точка входа

`src/main.rs` выполняет:

- загрузку `.env` через `dotenv().ok()`;
- инициализацию tracing;
- чтение конфига из env;
- создание PostgreSQL pool;
- создание `AppState`;
- сборку router-ов;
- подключение Swagger UI;
- подключение CORS;
- запуск Axum server на `127.0.0.1:8000`.

CORS настроен через `tower_http::cors::CorsLayer`:

- `allow_origin(Any)`
- `allow_methods(Any)`
- разрешенные headers: `AUTHORIZATION`, `CONTENT_TYPE`, `ACCEPT`

## AppState

`AppState` находится в `src/config.rs`.

Он хранит:

- `user_repo: Arc<UserRepo<Postgres>>`
- `token_serv: Arc<TokenService<Postgres>>`

При создании также создается `TokenRepo`, который передается в `TokenService`.

Текущие длительности токенов:

- access token: 15 минут
- refresh token: 1440 минут

## База данных

Инициализация находится в `db/init-scripts/init.sql`.

Таблица `users`:

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID NOT NULL PRIMARY KEY,
  "name" varchar NOT NULL,
  "role" text NOT NULL,
  "email" varchar NOT NULL UNIQUE,
  "password_hash" varchar NOT NULL
);
```

Таблица `refresh_tokens`:

```sql
CREATE TABLE IF NOT EXISTS "refresh_tokens"(
  "user_id" UUID NOT NULL UNIQUE,
  "token" text NOT NULL
);
```

`drop_tables.sql` сейчас удаляет `user_tags` и `users`, но не удаляет `refresh_tokens`.

Важное по SQLx:

- SQLx query macros проверяют запросы на этапе компиляции.
- Для этого нужна доступная база с актуальной схемой.
- В `Notes.md` отдельно указано, что нужен `cargo sqlx`, особенно для `cargo sqlx prepare`.

## Docker

`Dockerfile` основан на образе `postgres`.

Он копирует SQL-скрипты:

```dockerfile
COPY ./db/init-scripts/ /docker-entrypoint-initdb.d/
```

`docker-compose.yml` поднимает:

- `db` - PostgreSQL с init scripts;
- `pgadmin` - pgAdmin 4.

PostgreSQL:

- container name: `axum_postgres`
- порт берется из `${POSTGRES_PORT}`
- данные хранятся в volume `postgres_data`
- init scripts монтируются в `/docker-entrypoint-initdb.d`

pgAdmin:

- container name: `pgadmin`
- порт `80:80`
- volume `pgadmin`

## Роутинг

Роуты собираются в `src/routes.rs`.

Корневой router включает:

```text
/auth
/user
/aboba
/docs
```

Swagger-документация создается через `utoipa` и `utoipa-swagger-ui`.

Для Swagger добавлена security scheme:

```text
bearer_auth: HTTP Bearer JWT
```

## Auth routes

Auth routes описаны в `src/handlers/auth.rs`.

Base path:

```text
/auth
```

### POST /auth/registration

Регистрирует пользователя.

Request body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password"
}
```

Response `200`:

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

Ошибки:

- `409` - пользователь с таким email уже существует
- `500` - ошибка базы данных

### POST /auth/login

Авторизует пользователя.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response `200`:

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

Ошибки:

- `401` - неверный email или пароль
- `500` - ошибка базы данных

### PUT /auth/refresh_tokens

Обновляет пару токенов.

Refresh token передается query-параметром, потому что handler принимает `Query<RefreshToken>`:

```text
/auth/refresh_tokens?token=...
```

Response `200`:

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

Ошибки:

- `401` - refresh token невалиден, истек или не найден в БД
- `500` - ошибка базы данных

## User routes

User routes описаны в `src/handlers/users.rs`.

Base path:

```text
/user
```

Все user routes защищены:

- `auth_middleware` проверяет Bearer access token;
- `role_middleware` проверяет роль.

Сейчас для user router разрешены все роли из `Role::all()`: `User` и `Admin`.

### GET /user/my_profile

Возвращает профиль текущего пользователя по `sub` из JWT claims.

Headers:

```text
Authorization: Bearer <access_token>
```

Response `200`:

```json
{
  "id": "...",
  "name": "User Name",
  "email": "user@example.com"
}
```

Ошибки:

- `401` - нет или невалидный токен
- `404` - пользователь не найден
- `500` - ошибка базы данных

### POST /user/create_admin

Создает пользователя с ролью `Admin`.

Headers:

```text
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password"
}
```

Response `200`:

```json
{
  "id": "...",
  "name": "Admin Name",
  "email": "admin@example.com"
}
```

Важно: несмотря на название, в текущем router-е эта ручка доступна любой авторизованной роли, потому что используется `Role::all()`, а не `Role::admin_only()`.

### PUT /user/

Обновляет данные текущего пользователя.

Headers:

```text
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "name": "New Name",
  "email": "new@example.com",
  "password": "new_password"
}
```

Response:

```text
204 No Content
```

Handler берет `id` и `role` из JWT claims, поэтому клиент не может напрямую поменять `id` и роль через body.

### GET /user/{offset}/{page_limit}

Возвращает пользователей с пагинацией.

Headers:

```text
Authorization: Bearer <access_token>
```

Пример:

```text
GET /user/0/10
```

Response `200`:

```json
[
  {
    "id": "...",
    "name": "User Name",
    "email": "user@example.com"
  }
]
```

Если пользователей в диапазоне нет, возвращается:

```text
204 No Content
```

## Test route /aboba

В `src/routes.rs` есть защищенный тестовый router:

```text
GET /aboba/abobus
```

Он требует Bearer access token и разрешает все роли из `Role::all()`.

Response:

```text
aboba
```

## Middleware

`auth_middleware`

- Читает `Authorization` header.
- Ожидает схему `Bearer`.
- Валидирует access token через `TokenService::validate_access_token`.
- Кладет `Claims` в extensions запроса.
- При ошибке возвращает `AuthError`.

`role_middleware`

- Достает `Claims` из extensions.
- Проверяет, что роль пользователя входит в `allowed_roles`.
- При отсутствии claims возвращает `401`.
- При нехватке прав возвращает `403`.

Порядок важен: сначала должен отработать auth middleware, чтобы role middleware получил claims.

## Tokens

Сервис токенов находится в `src/services/auth/tokens.rs`.

`Claims`:

```rust
pub struct Claims {
    pub sub: Uuid,
    pub role: String,
    pub exp: usize,
    pub jti: Option<String>,
}
```

Access token:

- подписывается `JWT_SECRET`;
- содержит `sub`, `role`, `exp`;
- `jti` равен `None`;
- живет 15 минут.

Refresh token:

- подписывается `JWT_SECRET_REFRESH`;
- содержит `sub`, `role`, `exp`, `jti`;
- живет 1440 минут;
- сам refresh token отдается клиенту;
- hash refresh token сохраняется в таблицу `refresh_tokens`.

При refresh:

1. refresh token декодируется и проверяется по `JWT_SECRET_REFRESH`;
2. пользователь ищется по `sub`;
3. hash переданного refresh token сравнивается с hash в БД;
4. если все корректно, генерируется новая пара токенов;
5. hash нового refresh token сохраняется в БД через upsert.

## Password hashing

Хеширование находится в `src/services/auth/hashing.rs`.

Пароль хешируется SHA-512:

```rust
Sha512(password) -> hex string
```

Соли и password hashing алгоритма уровня Argon2/bcrypt сейчас нет.

## Repositories

`UserRepo`

Файл: `src/repositories/users.rs`.

Методы:

- `get(offset, limit)`
- `get_by_id(id)`
- `get_by_email(email)`
- `check_login(email, password_hash)`
- `create_admin(executer, user)`
- `create(executer, user)`
- `update(executer, user)`

Для `Limit` и `Offset` используются newtype wrappers с derive macro `NewTypeDeref`.

`TokenRepo`

Файл: `src/repositories/tokens.rs`.

Методы:

- `get(user_id)` - возвращает hash refresh token;
- `create(executer, refresh_token_info)` - вставляет или обновляет hash refresh token.

`is_unique_violation`

Файл: `src/repositories/mod.rs`.

Проверяет PostgreSQL error code `23505`, чтобы отличить конфликт уникальности.

## Models

`User`:

```rust
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: Role,
    pub password_hash: String,
}
```

`Role`:

```rust
pub enum Role {
    User,
    Admin,
}
```

`Tokens`:

```rust
pub struct Tokens {
    pub access_token: String,
    pub refresh_token: String,
}
```

## Schemas

`RegisterUser`:

```rust
pub struct RegisterUser {
    pub name: String,
    pub email: String,
    pub password: String,
}
```

`LoginUser`:

```rust
pub struct LoginUser {
    pub email: String,
    pub password: String,
}
```

`UserResponse`:

```rust
pub struct UserResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
}
```

`RefreshToken`:

```rust
pub struct RefreshToken {
    pub token: String,
}
```

## Errors

Ошибки лежат в `src/errors`.

`UserError`:

- `Db` -> `500`
- `NotFound` -> `404`
- `UserAlreadyExists` -> `409`

`TokenError`:

- database/system time -> `500`
- JWT/expired/invalid/header/schema/refresh-not-found -> `401`

`AuthError`:

- database -> `500`
- token/user errors прокидываются как соответствующие responses
- `Unauthorized` -> `401`
- `Forbidden` -> `403`

Все эти типы реализуют `IntoResponse`, поэтому handlers могут возвращать `Result<impl IntoResponse, ...>`.

## Swagger

Swagger собирается в `src/routes.rs`.

Документация подключает:

- `AuthDocs`
- `UserDocs`
- `AbobaDocs`

Для защищенных ручек в `utoipa::path` указано:

```rust
security(
    ("bearer_auth" = [])
)
```

Это позволяет отправлять Bearer token из Swagger UI.

## Локальный proc-macro crate

Папка:

```text
backend/macroses
```

Crate объявлен как:

```toml
[lib]
proc-macro = true
```

Сейчас реализован derive macro:

```rust
#[derive(NewTypeDeref)]
```

Он генерирует `impl Deref` для tuple struct с одним unnamed field. Используется для:

```rust
pub struct Limit(pub u64);
pub struct Offset(pub u64);
```

## Tracing

Настройка находится в `src/traicing.rs`.

По умолчанию используется фильтр:

```text
sqlx=info,tower_http=debug,info
```

Его можно переопределить через стандартную переменную `RUST_LOG`.

## Важные замечания по текущему коду

- Файл называется `traicing.rs`, вероятно, имелось в виду `tracing.rs`.
- В `drop_tables.sql` не удаляется таблица `refresh_tokens`.
- `create_admin` сейчас доступен всем авторизованным пользователям, потому что user router использует `Role::all()`.
- `services/users.rs` пустой.
- В backend нет routes для цитат, хотя frontend ожидает `/Quote/...`.
- Пути backend сейчас lowercase/snake_case: `/auth/login`, `/auth/registration`, `/auth/refresh_tokens`, `/user/my_profile`.
- Frontend из папки `frontend` ожидает другие пути и формат полей токенов: например `Auth/Login`, `Auth/Registration`, `Auth/RefreshAllTokens`, `User/myprofile`, `accessToken`, `refreshToken`.
- Backend user schema использует поле `name`, а frontend profile/register типы используют `firstName` и `secondName`.
- Password hashing реализован через SHA-512 без соли; для production лучше использовать Argon2 или bcrypt.
