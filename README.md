# Multibank Group Exam

Monorepo with:
- `frontend` (Next.js on port `3110`)
- `backend/auth-service` (Node.js/TypeScript on port `4001`)
- `backend/market-service` (Node.js/TypeScript on port `4002`)

## Project Overview

This project is a simple microservice-based market dashboard.

- `auth-service` provides mock login and JWT token issuance.
- `market-service` provides market REST APIs and live WebSocket price updates.
- `frontend` provides login, live ticker dashboard, chart visualization, and history table.

Core capabilities:

- JWT/Bearer authentication flow across services
- Real-time ticker streaming (`AAPL`, `TSLA`, `BTC-USD`)
- Historical price API with frontend caching via Zustand
- Threshold-based price alerting in the dashboard
- Docker and Kubernetes deployment support with helper scripts

## Assumptions

- This project is designed for local development and evaluation.
- Authentication uses mocked credentials and JWT without a database.
- Market data is simulated in-memory (mock feed), not from a live provider.
- Historical prices are in-memory on backend and client-cached on frontend.
- For local Kubernetes access, services are exposed through `kubectl port-forward`.
- Default local ports are:
  - Frontend: `3110`
  - Auth service: `4001`
  - Market service: `4002`

## Tradeoffs

- Mock authentication is fast to integrate, but does not represent production-grade identity/security flows.
- In-memory market state is simple and low-latency, but data is lost on restart and not shared across replicas.
- Frontend-side caching improves UX and reduces API calls, but cache consistency is eventually-updated.
- WebSocket token access from browser code enables direct realtime subscriptions, but is less secure than fully server-side token handling.
- Manual/port-forward local access keeps setup simple, but is not equivalent to ingress-based production networking.

## Bonus Features

- Add user authentication (mocked): Implemented
- Implement caching for historical data: Implemented (Zustand-based frontend cache)
- Add alerting for price thresholds: Implemented (dashboard threshold alerts)
- Deploy using Kubernetes manifests: Implemented (`k8s/` manifests + helper scripts)

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

## Backend Tests

If this is your first run, install dependencies first.  
If you already ran `npm install` before, you can skip it.

Run tests per backend service:

```bash
cd backend/auth-service
npm install
npm test
```

```bash
cd backend/market-service
npm install
npm test
```

Or run both from project root:

```bash
(cd backend/auth-service && npm install && npm test) && (cd backend/market-service && npm install && npm test)
```

## Run with Kubernetes

The manifests are in `k8s/`:

- `00-namespace.yaml`
- `01-configmap.yaml`
- `02-secret.yaml`
- `10-auth-service.yaml`
- `20-market-service.yaml`
- `30-frontend.yaml`

### 1. Build local images

From project root:

```bash
docker build -t multibank/auth-service:local backend/auth-service
docker build -t multibank/market-service:local backend/market-service
docker build \
  --build-arg NEXT_PUBLIC_AUTH_API_URL=http://localhost:4001 \
  --build-arg NEXT_PUBLIC_MARKET_API_URL=http://localhost:4002 \
  --build-arg NEXT_PUBLIC_MARKET_WS_URL=ws://localhost:4002/ws \
  --build-arg NEXT_PUBLIC_HISTORY_CACHE_TTL_MS=30000 \
  --build-arg NEXT_PUBLIC_LOCAL_CACHE_SECRET=multibank-local-cache-secret \
  -t multibank/frontend:local frontend
```

If you use `kind`, load the images:

```bash
kind load docker-image multibank/auth-service:local
kind load docker-image multibank/market-service:local
kind load docker-image multibank/frontend:local
```

### 2. Deploy manifests

```bash
kubectl apply -f k8s/
kubectl -n multibank get pods
kubectl -n multibank get svc
```

### 3. Access locally via port-forward

Run these in separate terminals:

```bash
kubectl -n multibank port-forward svc/auth-service 4001:4001
kubectl -n multibank port-forward svc/market-service 4002:4002
kubectl -n multibank port-forward svc/frontend 3110:3110
```

Then open [http://localhost:3110](http://localhost:3110).

### Scripted Kubernetes Start/Stop

Use helper scripts from project root:

```bash
./scripts/kubernetes_start.sh
./scripts/kubernetes_stop.sh
```

By default, `kubernetes_start.sh` also starts background port-forwards for:

- `auth-service` -> `localhost:4001`
- `market-service` -> `localhost:4002`
- `frontend` -> `localhost:3110`

Port-forward logs and pid files are stored in `.port-forward/`.
`kubernetes_stop.sh` will stop these background port-forwards automatically.

Optional teardown flags:

```bash
# Also delete kind cluster
DELETE_CLUSTER=true ./scripts/kubernetes_stop.sh

# Also delete local Docker images
DELETE_IMAGES=true ./scripts/kubernetes_stop.sh

# Delete both cluster and images
DELETE_CLUSTER=true DELETE_IMAGES=true ./scripts/kubernetes_stop.sh
```

Optional script env overrides:

```bash
CLUSTER_NAME=multibank NAMESPACE=multibank ./scripts/kubernetes_start.sh
CLUSTER_NAME=multibank NAMESPACE=multibank ./scripts/kubernetes_stop.sh

# Disable background port-forwards
PORT_FORWARD=false ./scripts/kubernetes_start.sh

# Custom port-forward dir
PORT_FORWARD_DIR=/tmp/multibank-pf ./scripts/kubernetes_start.sh
PORT_FORWARD_DIR=/tmp/multibank-pf ./scripts/kubernetes_stop.sh
```

### 4. Update secret/config values

Edit:

- `k8s/01-configmap.yaml`
- `k8s/02-secret.yaml`

Then re-apply:

```bash
kubectl apply -f k8s/
kubectl -n multibank rollout restart deploy/auth-service deploy/market-service deploy/frontend
```
