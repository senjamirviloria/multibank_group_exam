#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CLUSTER_NAME="${CLUSTER_NAME:-multibank}"
NAMESPACE="${NAMESPACE:-multibank}"
DELETE_CLUSTER="${DELETE_CLUSTER:-false}"
DELETE_IMAGES="${DELETE_IMAGES:-false}"
PORT_FORWARD_DIR="${PORT_FORWARD_DIR:-${ROOT_DIR}/.port-forward}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_cmd kubectl
require_cmd kind

cd "${ROOT_DIR}"

if [ -d "${PORT_FORWARD_DIR}" ]; then
  echo "Stopping background port-forwards..."
  for name in auth market frontend; do
    pid_file="${PORT_FORWARD_DIR}/${name}.pid"
    if [ -f "${pid_file}" ]; then
      pid="$(cat "${pid_file}")"
      if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
        kill "${pid}" 2>/dev/null || true
      fi
      rm -f "${pid_file}"
    fi
  done
fi

if kind get clusters | grep -qx "${CLUSTER_NAME}"; then
  echo "Deleting Kubernetes resources..."
  kubectl delete -f k8s/ --ignore-not-found=true || true
  kubectl delete namespace "${NAMESPACE}" --ignore-not-found=true || true
else
  echo "Cluster ${CLUSTER_NAME} not found, skipping manifest cleanup."
fi

if [ "${DELETE_CLUSTER}" = "true" ]; then
  if kind get clusters | grep -qx "${CLUSTER_NAME}"; then
    echo "Deleting kind cluster: ${CLUSTER_NAME}"
    kind delete cluster --name "${CLUSTER_NAME}"
  fi
fi

if [ "${DELETE_IMAGES}" = "true" ]; then
  if command -v docker >/dev/null 2>&1; then
    echo "Deleting local Docker images..."
    docker rmi multibank/auth-service:local multibank/market-service:local multibank/frontend:local || true
  fi
fi

echo "Kubernetes teardown completed."
