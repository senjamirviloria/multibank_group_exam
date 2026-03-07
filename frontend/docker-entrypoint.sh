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

exec node server.js
