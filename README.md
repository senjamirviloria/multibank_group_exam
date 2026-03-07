# Multibank Group Exam

Monorepo with:
- `frontend` (Next.js on port `3110`)
- `backend/auth-service` (Node.js/TypeScript on port `4001`)
- `backend/market-service` (Node.js/TypeScript on port `4002`)

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (for containerized run)

## Environment Files

Create env files from examples as needed:

- Root: `.env.example`
- Frontend: `frontend/.env.example`
- Auth service: `backend/auth-service/.env.example`
- Market service: `backend/market-service/.env.example`

Optional quick setup:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/auth-service/.env.example backend/auth-service/.env
cp backend/market-service/.env.example backend/market-service/.env
```

## Run with Docker (Recommended)

From project root:

```bash
./scripts/start.sh
```

This builds and starts:
- Frontend: [http://localhost:3110](http://localhost:3110)
- Auth service: [http://localhost:4001](http://localhost:4001)
- Market service: [http://localhost:4002](http://localhost:4002)

Stop containers:

```bash
./scripts/stop.sh
```

## Run Locally (Without Docker)

Open 3 terminals from project root.

1. Auth service

```bash
cd backend/auth-service
npm install
npm start
```

2. Market service

```bash
cd backend/market-service
npm install
npm start
```

3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3110](http://localhost:3110).

## Default Login (Mock)

- Username: `demo@multibank.local`
- Password: `password123`

(Values can be changed via `backend/auth-service/.env`.)

## Useful Commands

- Rebuild/restart Docker stack:

```bash
docker compose up --build -d
```

- View running containers:

```bash
docker compose ps
```

- Tail logs:

```bash
docker compose logs -f frontend
docker compose logs -f auth-service
docker compose logs -f market-service
```
