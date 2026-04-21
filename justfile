set shell := ["bash", "-uc"]

mock-backend:
    node mock-backend/server.mjs

frontend:
    cd frontend && VITE_API_URL=http://127.0.0.1:8000/api/v1 npm run dev -- --host 127.0.0.1

dev:
    trap 'kill 0' EXIT; \
    node mock-backend/server.mjs & \
    cd frontend && VITE_API_URL=http://127.0.0.1:8000/api/v1 npm run dev -- --host 127.0.0.1

test-frontend:
    cd frontend && npm test

lint-frontend:
    cd frontend && npm run lint

build-frontend:
    cd frontend && npm run build
