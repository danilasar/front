# Документация по backend

Документ описывает backend из папки `backend` и текущий статус соответствия целевому контракту `openapi.yaml`.

## Назначение

Backend - Rust API на Axum + PostgreSQL для платформы управления хакатонами:

- auth (JWT access/refresh);
- хакатоны (CRUD, активный хакатон, активация, загрузка регламента);
- админка (организаторы, назначения организаторов на хакатон);
- динамические поля формы (form-fields);
- команды (подача заявки, листинг, модерация статуса, дисквалификация участников);
- приглашения (invite onboarding);
- экспорт заявок/команд в CSV.

## Стек

- Rust 2024 edition
- Axum 0.8
- SQLx + PostgreSQL
- JWT через `jsonwebtoken`
- SHA-512 hashing через `sha2` + `hex` (без соли)
- Serde
- Utoipa + Swagger UI (генерируется из handler-аннотаций, НЕ из `openapi.yaml`)
- Docker Compose для PostgreSQL

## Запуск

Команды из корня репозитория (см. `justfile`):

```bash
just db-up
just backend
```

Backend слушает:

```text
http://127.0.0.1:8000
```

Healthcheck:

```text
GET http://127.0.0.1:8000/api/v1/health
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

OpenAPI JSON (utoipa):

```text
http://127.0.0.1:8000/api-docs/openapi.json
```

## Переменные окружения

Берутся из `backend/.env`:

```env
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_SECRET_REFRESH=...
POSTGRES_PORT=...
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
```

## Роутинг

Все API-роуты висят под префиксом:

```text
/api/v1
```

Сборка роутов: `backend/src/routes.rs`.

Текущие основные группы:

- `/api/v1/auth/*` - `backend/src/handlers/auth.rs`
- `/api/v1/users/*` - `backend/src/handlers/users.rs` (защищено auth+role middleware)
- `/api/v1/hackathons/*` - `backend/src/handlers/hackathons.rs`
- `/api/v1/hackathons/{hackathon_id}/teams/*` - `backend/src/handlers/teams.rs`
- `/api/v1/hackathons/{hackathon_id}/form-fields/*` - `backend/src/handlers/forms.rs`
- `/api/v1/admin/*` - `backend/src/handlers/admin.rs` (ВАЖНО: сейчас без middleware/проверок ролей)
- `/api/v1/invitations/*` - `backend/src/handlers/invitations.rs`
- misc routes (exports/files/feedback/test seed): `backend/src/handlers/misc.rs`

## База данных

Инициализация схемы: `backend/db/init-scripts/init.sql`.

Ключевые таблицы:

- `users` - пользователи и профильные поля (часть хранится как JSONB в `profile_fields`)
- `refresh_tokens` - хранение hash refresh token по `user_id`
- `hackathons` - хакатоны + landing/регламент (ссылка на file_id, сам файл пока не хранится)
- `hackathon_organizers` - назначения организаторов на хакатон
- `form_fields` - динамические поля (scope: `profile|team|feedback`)
- `teams`, `team_members` - команды и участники
- `invitations` - токены приглашений на участника команды

## Dev seed (без авторизации)

Для локальной разработки добавлена тестовая ручка (НЕ часть `openapi.yaml`):

- `POST /api/v1/test/seed` - создает/обновляет фиксированных пользователей и команду из 2 человек.

Реализация: `backend/src/handlers/misc.rs`.

## Отчет по соответствию `openapi.yaml`

Ниже - фактический статус относительно целевого контракта `openapi.yaml` (по состоянию текущего кода).

### Полностью реализовано (для фронта)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` - работают.
- `GET /hackathons/active`, `GET /hackathons/{hackathonId}` - работают.
- `GET /hackathons/{hackathonId}/form-fields`, `POST /hackathons/{hackathonId}/form-fields` - работают.
- `DELETE /hackathons/{hackathonId}/form-fields/{fieldId}` - работает.
- `GET /hackathons/{hackathonId}/teams`, `POST /hackathons/{hackathonId}/teams` - работают (возвращается `Page` + `TeamApplicationResponse` как в фронте).
- `PATCH /hackathons/{hackathonId}/teams/{teamId}/status` - работает.
- `DELETE /hackathons/{hackathonId}/teams/{teamId}/members/{memberId}` - работает.
- `GET /invitations/{inviteToken}` - работает (shape соответствует фронту).
- `POST /invitations/{inviteToken}/complete-registration` - работает (возвращает `AuthResponse`).
- `GET /hackathons/{hackathonId}/exports/teams?format=csv` - работает (CSV).

### Реализовано, но расходится с `openapi.yaml`

- `POST /auth/logout`: по openapi должен инвалидировать refresh token, сейчас всегда `204` без логики.
- `GET /users/{userId}`: по openapi должен возвращать `UserPublic` и иметь `403`, сейчас возвращает `UserProfile` и доступен всем ролям (только под auth).
- `PATCH /users/me`: по openapi `UpdateUserProfileRequest` (partial), сейчас принимает `RegisterUser` и обновляет только `fullName/email`.
- `GET /admin/organizers`: по openapi `UserPage` + `page/pageSize/q`, сейчас фиксированный `Page` без query параметров, плюс без проверки роли admin.
- `POST /admin/organizers`: по openapi `CreateOrganizerRequest` (включая phone), сейчас используется `RegisterUser`, `phone` игнорируется, нет проверки роли admin.
- `PATCH /admin/organizers/{organizerId}`: по openapi `UpdateOrganizerRequest`, сейчас принимается произвольный JSON и обновляются только `fullName/email`, нет проверки роли admin.
- `GET /admin/hackathons/{hackathonId}/organizers`: по openapi возвращает список `UserPublic`, сейчас возвращает `Uuid[]`.
- `PUT /admin/hackathons/{hackathonId}/organizers`: по openapi возвращает список `UserPublic`, сейчас `204`.
- `GET /hackathons`: по openapi поддерживает `page/pageSize/q/status` и возвращает `HackathonPage`, сейчас возвращает `Page` но игнорирует `page/pageSize/q` (и `pageSize` равен `items.len()`).
- `POST /hackathons`, `PATCH /hackathons/{id}`, `DELETE /hackathons/{id}`, `POST /hackathons/{id}/activate`: по openapi требуют роли (`admin`/`assigned_organizer`), сейчас middleware/проверки ролей на этих ручках нет.
- `PUT /hackathons/{id}/rules`: по openapi должен вернуть `FileAsset`, сейчас возвращает `Hackathon` и только проставляет `rules_file_id` (файл не сохраняется).
- `PATCH /hackathons/{hackathonId}/form-fields/{fieldId}`: по openapi обновляет поле (label/type/options/order/etc), сейчас поддержаны только `required/visible`.
- `POST /hackathons/{hackathonId}/teams/{teamId}/members/{memberId}/disqualify`: по openapi `POST` + optional reason, сейчас поддержаны `POST` и `PATCH`, reason игнорируется.
- `POST /invitations/{inviteToken}/accept-existing`: по openapi должен вернуть `Team` (`200`), сейчас возвращает `204`.
- `POST /invitations/{inviteToken}/complete-registration`: по openapi `201`, сейчас `200`; также openapi требует 410/expired, сейчас 410 не реализован (токен просто перестает находиться в repo по expires_at).
- `GET /hackathons/{hackathonId}/exports/teams`: по openapi обязательный `format` и поддержка XLSX, сейчас `format` опционален и по факту отдается только CSV.

### Не реализовано / заглушки

- `GET /hackathons/{hackathonId}/registrations` - отсутствует (фронт сейчас живет на `GET /teams`).
- `GET /hackathons/{hackathonId}/teams/me` - сейчас всегда `404`.
- `PATCH /hackathons/{hackathonId}/teams/{teamId}` - сейчас `501`.
- `PUT /hackathons/{hackathonId}/teams/{teamId}/members/{memberId}/captain` - отсутствует.
- `GET/POST /hackathons/{hackathonId}/feedback` - сейчас `501`.
- `POST /files` и `GET /files/{fileId}` - сейчас `501/404`.

### Авторизация и роли (критичный разрыв с openapi)

`openapi.yaml` активно использует `x-roles` (`admin`, `assigned_organizer`). Сейчас в коде:

- middleware `auth_middleware` и `role_middleware` подключены только на `UserRouter` и тестовый `/aboba`;
- `AdminRouter`, `HackathonRouter`, `TeamRouter`, `FormRouter`, `MiscRouter` - не защищены и не проверяют роли.

Это означает, что по факту многие административные/организаторские операции доступны без токена. Для продакшена это нужно закрывать.
