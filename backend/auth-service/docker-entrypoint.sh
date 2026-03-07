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

read_secret PORT
read_secret CORS_ORIGIN
read_secret JWT_SECRET
read_secret MOCK_AUTH_USERNAME
read_secret MOCK_AUTH_PASSWORD

exec node dist/index.js
