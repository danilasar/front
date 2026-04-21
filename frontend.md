# Требования к фронтенду

Для успешной сдачи проекта, он должен соответствовать всем требованиям, перечисленным ниже.

1. Технические требования к коду

TypeScript: Проект должен быть написан с использованием TypeScript, все файлы должны иметь расширение .tsx или .ts.


Типизация: Все функции, методы и данные с сервера должны быть строго типизированы.

Запрет на any: Использование типов any и never запрещено. При крайней необходимости их использования требуется письменная аргументация.


Архитектура папок:


src/components/ — переиспользуемые компоненты.


src/ui/ — кастомные визуальные элементы (кнопки, инпуты, селекты).


src/utils/ — утилитарные функции.

2. Управление состоянием (Redux Toolkit)

Хранилище: Организовано с помощью react-redux и RTK.


Слайсы: Необходимо создать не менее 3 собственных слайсов.

Один из кастомных слайсов должен ссылаться на другой и использовать его actions.


Обязательные хранилища (не учитываются в общем количестве):

Хранилище пользователя: данные о пользователе, статус авторизации и доп. параметры.


Хранилище настроек: данные о загрузке с сервера, управление модальными окнами ошибок.

3. Работа с сетью и UI

Axios: Реализация методов GET, POST, PUT, DELETE, PATCH.


Визуализация загрузки: Каждый запрос к бэкенду должен сопровождаться индикатором загрузки (spinner, progress bar).


Обработка ошибок: При получении не 200-х кодов должна отображаться модальная форма с ошибкой.


Оптимизация: Запросы при старте должны проходить строго 1 раз без дублирования.

4. Роутинг и Страницы
Многостраничность реализуется через react-router-dom.

Необходимые страницы:

Приветствие (Лендинг).

Авторизация и Регистрация.

Личный кабинет и страница данных после авторизации.

3 дополнительные уникальные страницы (зависят от тематики бэкенда).

Страница 404: должна иметь возможность возврата в корень дерева путей.

Оберточные компоненты (HOC/Wrappers):


AuthWrapper — контроль авторизации.


CommonWrapper — контроль состояния.

5. UI/UX и Стилизация

Стили: Можно использовать библиотеки (MUI, Bootstrap, Antd) или чистый CSS/SCSS/SASS.

Грамотный интерфейс: Интуитивно понятный UI. У каждой кнопки должна быть подпись, иконка или tooltip с пояснением.

6. Процесс отчета и проверки
Проект должен собираться без ошибок через yarn/npm/bun build.

Запуск через start не должен приводить к 500-м ошибкам страниц.

Все запрошенные страницы должны возвращать код 200.

При отсутствии доступа страницы должны возвращать коды 401, 403 или 404

# Документация по фронтенду

Документ описывает приложение из папки `frontend`.

## Назначение

Фронтенд - React-приложение для сервиса цитат. В приложении есть лендинг, регистрация, вход, профиль пользователя, создание цитаты, лента цитат с пагинацией и страница случайной цитаты.

## Стек

- React 19
- TypeScript
- Vite
- React Router DOM 7
- Redux Toolkit + React Redux
- Axios
- React Hook Form
- Material UI 7
- `vite-plugin-svgr` для импорта SVG как React-компонентов
- ESLint

## Запуск

Рабочая директория:

```bash
cd frontend
```

Установка зависимостей:

```bash
npm install
```

Запуск dev-сервера:

```bash
npm run dev
```

Сборка:

```bash
npm run build
```

Проверка линтером:

```bash
npm run lint
```

Preview production-сборки:

```bash
npm run preview
```

В `package.json` также есть команда:

```bash
npm run start
```

Она выполняет `vite build | vite preview`. Для обычной локальной разработки лучше использовать `npm run dev`.

## Переменные окружения

API-клиент берет базовый URL из переменной:

```env
VITE_API_URL=http://localhost:...
```

Переменная используется в `src/api/axios.ts`:

```ts
baseURL: import.meta.env.VITE_API_URL
```

Без нее запросы к бэкенду не будут иметь корректный базовый адрес.

## Структура

```text
frontend/
  public/                 статические файлы Vite
  src/
    api/                  axios-инстанс и API-типы
    assets/               SVG-ассеты
    components/           переиспользуемые компоненты приложения
    components/wrappers/  обертки авторизации, гостевого доступа и загрузки
    entities/             доменные типы пользователя и цитаты
    pages/                страницы роутера
    store/                Redux store, slices, thunks, typed hooks
    types/                декларации типов
    ui/                   низкоуровневые UI-компоненты
    utils/                утилиты
    App.tsx               корневой компонент приложения
    main.tsx              точка входа React
    routes.tsx            конфигурация роутов и навигации
    theme.ts              светлая и темная MUI-темы
```

## Точка входа

`src/main.tsx` монтирует приложение в `#root` и оборачивает его в:

- `StrictMode`
- `Provider` с Redux store
- `BrowserRouter`

`src/App.tsx` отвечает за:

- переключение светлой и темной темы;
- сохранение `darkMode` в `localStorage`;
- подключение `ThemeProvider` и `CssBaseline`;
- отображение `NavBar`;
- глобальную модалку ошибок `ErrorModal`;
- обертки `CommonWrapper` и `AuthWrapper`;
- регистрацию маршрутов через `Routes` и `Route`.

## Роутинг

Роуты описаны в `src/routes.tsx`.

Публичные роуты:

- `/` - главная страница `Home`

Гостевые роуты:

- `/register` - регистрация
- `/login` - вход

Приватные роуты:

- `/profile` - профиль пользователя
- `/create-quote` - создание цитаты
- `/quotes` - лента цитат
- `/random-quotes` - случайная цитата

Навигационное меню строится из `navRouters`. Приватные пункты меню скрываются, если пользователь не авторизован.

## Обертки доступа

`AuthWrapper`

- При первом рендере вызывает `refreshAuth`.
- Использует `useRef`, чтобы не запускать инициализацию авторизации повторно.
- Нужен для восстановления сессии по refresh token.

`GuardWrapper`

- Защищает приватные страницы.
- Если `state.user.isAuth === false`, редиректит на `/login`.

`GuestWrapper`

- Защищает страницы входа и регистрации от авторизованных пользователей.
- Если пользователь уже авторизован, редиректит на `/profile`.

`CommonWrapper`

- Следит за `state.settings.isLoading`.
- При загрузке блюрит контент, блокирует клики и показывает `CircularProgress`.

## Redux Store

Store создается в `src/store/index.ts`.

Подключены слайсы:

- `user`
- `settings`
- `quotes`

Типы:

- `RootState = ReturnType<typeof store.getState>`
- `AppDispatch = typeof store.dispatch`

Typed hooks находятся в `src/store/hooks.ts`:

- `useAppDispatch`
- `useAppSelector`

## User state

Файлы:

- `src/store/user/slice.ts`
- `src/store/user/thunks.ts`
- `src/store/user/types.ts`

Состояние:

```ts
type UserState = {
  user: User | null;
  isAuth: boolean;
  isUserLoaded: boolean;
  isAuthInitialized: boolean;
}
```

Основные actions:

- `authSuccess`
- `authFailed`
- `setUser`
- `clearUser`

Основные thunks:

- `login`
- `register`
- `logout`
- `getMe`
- `refresh`
- `refreshAuth`

Токены сохраняются в `sessionStorage`:

- `accessToken`
- `refreshToken`

## Settings state

Файлы:

- `src/store/settings/slice.ts`
- `src/store/settings/types.ts`

Состояние:

```ts
type SettingsState = {
  isLoading: boolean;
  error: string | null;
  isErrorModalOpen: boolean;
}
```

Actions:

- `startLoading`
- `stopLoading`
- `setError`
- `clearError`

Этот слайс используется thunks для глобального индикатора загрузки и показа ошибок.

## Quotes state

Файлы:

- `src/store/quote/slice.ts`
- `src/store/quote/thunks.ts`
- `src/store/quote/types.ts`

Состояние:

```ts
type QuoteState = {
  quotes: Quote[];
  randomQuote: Quote | null;
  offset: number;
  limit: number;
  total: number;
}
```

Actions:

- `setQuotes`
- `setTotal`
- `setRandomQuote`

Thunks:

- `createQuote`
- `fetchQuotes`
- `fetchQuotesCount`
- `fetchRandomQuote`

## API-клиент

Axios-инстанс находится в `src/api/axios.ts`.

Настройки:

- `baseURL` берется из `VITE_API_URL`;
- `timeout: 10000`;
- `Content-Type: application/json`;
- перед каждым запросом `accessToken` из `sessionStorage` добавляется в `Authorization: Bearer ...`.

Response interceptor:

- ловит `401`;
- если запрос еще не повторялся и это не refresh endpoint, пытается обновить токены через `Auth/RefreshAllTokens`;
- при успехе сохраняет новые токены и повторяет исходный запрос;
- при ошибке очищает токены и пробрасывает ошибку дальше.

Используемые endpoints:

- `POST Auth/Login`
- `POST Auth/Registration`
- `GET User/myprofile`
- `POST Auth/RefreshAllTokens`
- `PUT Auth/RefreshAllTokens`
- `POST /Quote`
- `GET /Quote/{offset}/{limit}`
- `GET /Quote/TotalQuotes`
- `GET /Quote/GetRand`

## Страницы

`Home`

- Лендинг сервиса.
- Показывает название, описание, кнопку перехода к профилю и демо-изображения ленты и случайных цитат.

`Login`

- Форма входа.
- Валидирует email и пароль.
- Отправляет `login`.

`Register`

- Форма регистрации.
- Валидирует имя, фамилию, email и пароль.
- Отправляет `register`.

`Profile`

- Показывает данные текущего пользователя.
- Позволяет выйти из аккаунта.

`CreateQuote`

- Форма создания цитаты.
- Минимальная длина цитаты - 3 символа.
- После отправки переходит на `/quotes`.

`QuotesPage`

- Загружает список цитат.
- Показывает `QuoteCard`.
- Использует MUI `Pagination`.
- Размер страницы хранится в `state.quotes.limit`.

`RandomQuotePage`

- Загружает случайную цитату.
- Кнопка `Удиви меня.` повторно вызывает загрузку случайной цитаты.

## Компоненты

`NavBar`

- Фиксированная навигация сверху.
- Строит ссылки из `navRouters`.
- Скрывает приватные ссылки для неавторизованного пользователя.
- Переключает тему через `ColorModeContext`.

`ErrorModal`

- Глобальная модалка ошибок.
- Читает `error` и `isErrorModalOpen` из `settings`.
- Закрытие вызывает `clearError`.

`AuthTemplatePage`

- Универсальный шаблон страниц входа и регистрации.
- На вход получает список полей, обработчик submit и ссылку переключения между login/register.

`QuoteCard`

- Карточка цитаты.
- Показывает текст цитаты, автора и дату создания.

## UI-компоненты

`CenterFullScreenLayout`

- Центрирует контент на весь экран.

`GridBackGroundLayout`

- Расширяет `CenterFullScreenLayout`.
- Добавляет фоновую сетку через CSS gradients.

`CustomForm`

- Общая вертикальная форма с submit-кнопкой.

`InputTextField`

- Обертка над MUI `TextField`.
- Подстраивает фон и цвет текста под текущую тему.

`Img`

- Простой компонент для картинок с шириной до `1000px`.

## Темизация

Темы находятся в `src/theme.ts`.

Есть две MUI-темы:

- `darkTheme`
- `lightTheme`

Текущий режим хранится в состоянии `App` и синхронизируется с `localStorage` по ключу `darkMode`.

Переключение темы доступно через `ColorModeContext`.

## Доменные типы

`User`:

```ts
type User = {
  id: number;
  email: string;
  firstName: string;
  secondName: string;
}
```

`Quote`:

```ts
type Quote = {
  quoteText: string;
  username: string;
  creationDate: string;
}
```

## Обработка ошибок

Утилита `getErrorMessage` находится в `src/utils/errorTemplateMessage.ts`.

Она сопоставляет HTTP-статусы с пользовательскими сообщениями:

- `400` - неверный запрос
- `404` - данные не найдены
- `409` - почта уже занята
- `422` - неправильные данные
- `500` - ошибка сервера

Если сервер вернул `response.data.message`, используется сообщение сервера.

## Важные замечания по текущему коду

- В проекте есть и `package-lock.json`, и `yarn.lock`. Лучше выбрать один пакетный менеджер и держать один lock-файл.
- В `src/api/axios.ts` и async thunks встречается `any` в `catch`. Если требования проекта запрещают `any`, эти места нужно типизировать отдельно.
- В `NavBar.tsx` оба импорта иконок указывают на `LightModeIcon`; для темной иконки, вероятно, нужен `DarkModeIcon` из `@mui/icons-material/DarkMode`.
- В `Login.tsx` и `Register.tsx` проверка `isAuth` и `isUserLoaded` сразу после `await dispatch(...)` может читать старые значения из текущего рендера. Надежнее редиректить по результату thunk или через `useEffect` по изменению состояния.
- В проекте нет явного 404 route.
- В `Readme.md` пока оставлен стандартный текст шаблона Vite.
