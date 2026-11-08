#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env.self-hosted ]; then
  umask 077
  cat > .env.self-hosted <<EOF
HIRETIVO_DB_PASSWORD=$(openssl rand -hex 24)
HIRETIVO_AUTH_SECRET=$(openssl rand -hex 32)
EOF
fi

docker compose --env-file .env.self-hosted up --build -d
printf 'Hiretivo is starting at http://localhost:3000\n'
