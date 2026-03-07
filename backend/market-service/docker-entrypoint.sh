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

exec node dist/index.js
