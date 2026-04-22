# Hackathon Manager Frontend

React + TypeScript + Vite frontend for a hackathon management platform.

## Current Scope

Implemented user-facing scenarios:

- browse hackathons;
- open hackathon details;
- register and log in;
- view profile;
- submit a team application;
- fill configured team fields in an application;
- add existing team members by login;
- add new team members and receive invite links;
- view team applications in a status-filtered table;
- moderate teams by admitting, rejecting, or disqualifying them;
- disqualify individual team members;
- export team applications to CSV and XLSX.

Implemented admin scenarios:

- create organizers;
- create hackathons;
- assign an organizer during hackathon creation;
- assign organizers to existing hackathons;
- view organizers and hackathons;
- filter hackathons by status and archive;
- switch the active hackathon;
- upload and view PDF hackathon rules;
- configure team fields for hackathon applications.

The visual direction is Frutiger Aero: glass panels, blue/green/white air gradients, water/sky motifs, translucent controls, and icon-led actions.

## Stack

- React 19
- TypeScript
- Vite
- React Router DOM 7
- Redux Toolkit
- React Redux
- Axios
- Material UI 7
- MUI Icons
- ESLint

## Run

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Tests:

```bash
npm test
```

## API

Set API base URL:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

If unset, the frontend falls back to:

```text
/api/v1
```

From the repository root, the mock backend can be started with:

```bash
node mock-backend/server.mjs
```

Demo users:

- `admin@example.test`
- `organizer@example.test`
- `participant@example.test`

Password:

```text
password
```

## Main Paths

- `/` - home;
- `/hackathons` - hackathon list;
- `/hackathons/:hackathonId` - hackathon details;
- `/hackathons/:hackathonId/teams` - team applications;
- `/admin` - admin panel;
- `/profile` - profile;
- `/login` - login;
- `/register` - registration.

## Notes

Legacy quote pages and stores are still present from the original template and are planned for removal.

Detailed frontend documentation is in `../frontend.md`.
