#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
umask 077

if [ ! -f .env.self-hosted ]; then
  printf 'Missing .env.self-hosted. Start the local installation first.\n' >&2
  exit 1
fi

backup_dir=${1:-"backups/$(date -u +%Y%m%dT%H%M%SZ)"}
if [ -e "$backup_dir" ]; then
  printf 'Backup destination already exists: %s\n' "$backup_dir" >&2
  exit 1
fi

if [ -z "$(docker compose --env-file .env.self-hosted ps -q app)" ]; then
  printf 'The app container is missing. Start the local installation first.\n' >&2
  exit 1
fi

app_was_running=$(docker compose --env-file .env.self-hosted ps --status running -q app)
if [ -n "$app_was_running" ]; then
  docker compose --env-file .env.self-hosted stop app
fi

restart_app() {
  if [ -n "$app_was_running" ]; then
    docker compose --env-file .env.self-hosted start app
  fi
}
trap restart_app EXIT

mkdir -p "$(dirname "$backup_dir")"
mkdir "$backup_dir"
mkdir "$backup_dir/files"
cp .env.self-hosted "$backup_dir/env.self-hosted"
docker compose --env-file .env.self-hosted exec -T db pg_dump -U hiretivo -d hiretivo -Fc > "$backup_dir/database.dump"
docker compose --env-file .env.self-hosted cp app:/app/data/files/. "$backup_dir/files/"
test -s "$backup_dir/database.dump"
printf 'Backup saved to %s. Keep it private: it includes your data and encryption key.\n' "$backup_dir"
