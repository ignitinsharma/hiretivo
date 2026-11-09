#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
umask 077

if [ "$#" -ne 2 ] || [ "$2" != "--replace" ]; then
  printf 'Usage: sh scripts/local-restore.sh BACKUP_DIRECTORY --replace\n' >&2
  printf 'This replaces the current database and uploaded files.\n' >&2
  exit 1
fi

backup_dir=$1
if [ ! -s "$backup_dir/database.dump" ] || [ ! -f "$backup_dir/env.self-hosted" ] || [ ! -d "$backup_dir/files" ]; then
  printf 'Backup is incomplete: expected database.dump, env.self-hosted, and files/.\n' >&2
  exit 1
fi

if [ -f .env.self-hosted ] && ! cmp -s .env.self-hosted "$backup_dir/env.self-hosted"; then
  printf 'Installation secrets differ from the backup. Restore into a fresh installation using the backed-up env.self-hosted file.\n' >&2
  exit 1
fi
if [ ! -f .env.self-hosted ]; then
  cp "$backup_dir/env.self-hosted" .env.self-hosted
fi

if [ -z "$(docker compose --env-file .env.self-hosted ps -q app)" ]; then
  printf 'The app container is missing. Run sh scripts/local-up.sh with the backed-up env file first.\n' >&2
  exit 1
fi

docker compose --env-file .env.self-hosted stop app
docker compose --env-file .env.self-hosted exec -T db pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error -U hiretivo -d hiretivo < "$backup_dir/database.dump"
docker compose --env-file .env.self-hosted run --rm --no-deps app node -e 'const fs = require("node:fs"); const path = "/app/data/files"; for (const name of fs.readdirSync(path)) fs.rmSync(`${path}/${name}`, { recursive: true, force: true });'
docker compose --env-file .env.self-hosted cp "$backup_dir/files/." app:/app/data/files/
docker compose --env-file .env.self-hosted start app
printf 'Restore complete. Data and files are available at http://localhost:3000.\n'
