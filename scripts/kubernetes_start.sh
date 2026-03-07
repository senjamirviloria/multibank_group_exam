#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CLUSTER_NAME="${CLUSTER_NAME:-multibank}"
NAMESPACE="${NAMESPACE:-multibank}"
PORT_FORWARD="${PORT_FORWARD:-true}"
PORT_FORWARD_DIR="${PORT_FORWARD_DIR:-${ROOT_DIR}/.port-forward}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_cmd docker
require_cmd kubectl
require_cmd kind

cd "${ROOT_DIR}"

if ! kind get clusters | grep -qx "${CLUSTER_NAME}"; then
  echo "Creating kind cluster: ${CLUSTER_NAME}"
  kind create cluster --name "${CLUSTER_NAME}"
else
  echo "Using existing kind cluster: ${CLUSTER_NAME}"
fi

echo "Building images..."
docker build -t multibank/auth-service:local backend/auth-service
docker build -t multibank/market-service:local backend/market-service
docker build \
  --build-arg NEXT_PUBLIC_AUTH_API_URL=http://localhost:4001 \
  --build-arg NEXT_PUBLIC_MARKET_API_URL=http://localhost:4002 \
  --build-arg NEXT_PUBLIC_MARKET_WS_URL=ws://localhost:4002/ws \
  --build-arg NEXT_PUBLIC_HISTORY_CACHE_TTL_MS=30000 \
  --build-arg NEXT_PUBLIC_LOCAL_CACHE_SECRET=multibank-local-cache-secret \
  -t multibank/frontend:local frontend

echo "Loading images into kind..."
kind load docker-image multibank/auth-service:local --name "${CLUSTER_NAME}"
kind load docker-image multibank/market-service:local --name "${CLUSTER_NAME}"
kind load docker-image multibank/frontend:local --name "${CLUSTER_NAME}"

echo "Applying manifests..."
kubectl apply -f k8s/

echo "Waiting for deployments..."
kubectl -n "${NAMESPACE}" rollout status deployment/auth-service --timeout=120s
kubectl -n "${NAMESPACE}" rollout status deployment/market-service --timeout=120s
kubectl -n "${NAMESPACE}" rollout status deployment/frontend --timeout=180s

echo
echo "Kubernetes deploy completed."
kubectl -n "${NAMESPACE}" get pods
kubectl -n "${NAMESPACE}" get svc
echo

if [ "${PORT_FORWARD}" = "true" ]; then
  mkdir -p "${PORT_FORWARD_DIR}"

  echo "Starting background port-forwards..."
  kubectl -n "${NAMESPACE}" port-forward svc/auth-service 4001:4001 >"${PORT_FORWARD_DIR}/auth.log" 2>&1 &
  echo $! > "${PORT_FORWARD_DIR}/auth.pid"

  kubectl -n "${NAMESPACE}" port-forward svc/market-service 4002:4002 >"${PORT_FORWARD_DIR}/market.log" 2>&1 &
  echo $! > "${PORT_FORWARD_DIR}/market.pid"

  kubectl -n "${NAMESPACE}" port-forward svc/frontend 3110:3110 >"${PORT_FORWARD_DIR}/frontend.log" 2>&1 &
  echo $! > "${PORT_FORWARD_DIR}/frontend.pid"

  echo "Port-forwards started."
  echo "Logs: ${PORT_FORWARD_DIR}"
else
  echo "Port-forward commands:"
  echo "kubectl -n ${NAMESPACE} port-forward svc/auth-service 4001:4001"
  echo "kubectl -n ${NAMESPACE} port-forward svc/market-service 4002:4002"
  echo "kubectl -n ${NAMESPACE} port-forward svc/frontend 3110:3110"
fi
