#!/bin/sh
set -eu

read_secret() {
  key="$1"
  file="/run/secrets/$key"
  if [ -f "$file" ]; then
    # shellcheck disable=SC2163
    export "$key=$(cat "$file")"
  fi
}

read_secret AUTH_API_URL
read_secret NEXT_PUBLIC_AUTH_API_URL
read_secret NEXT_PUBLIC_MARKET_API_URL
read_secret NEXT_PUBLIC_MARKET_WS_URL
read_secret NEXT_PUBLIC_HISTORY_CACHE_TTL_MS
read_secret PORT_FRONTEND
read_secret HOSTNAME_FRONTEND

# Allow frontend port/host overrides via secrets while keeping sane local defaults.
if [ -n "${PORT_FRONTEND:-}" ] && [ -z "${PORT:-}" ]; then
  export PORT="$PORT_FRONTEND"
fi

if [ -n "${HOSTNAME_FRONTEND:-}" ] && [ -z "${HOSTNAME:-}" ]; then
  export HOSTNAME="$HOSTNAME_FRONTEND"
fi

export PORT="${PORT:-3110}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

exec node server.js
