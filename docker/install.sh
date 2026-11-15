#!/bin/sh
# One-command local install (E12-4): downloads the Compose file, makes the
# secrets and a sign-in password on the first run, then starts Hiretivo and
# its database on 127.0.0.1 only. Run it again to start an install that's
# already set up; it keeps the same secrets and data.
#
#   curl -fsSL https://raw.githubusercontent.com/ignitinsharma/hiretivo/main/docker/install.sh | sh
#
# or, from a checkout: ./docker/install.sh
#
# HIRETIVO_DIR changes the folder (default ~/hiretivo), HIRETIVO_IMAGE the
# image, and HIRETIVO_PORT the port on this computer (default 3000).
set -eu

DEFAULT_IMAGE="ghcr.io/ignitinsharma/hiretivo:latest"
COMPOSE_URL="${HIRETIVO_COMPOSE_URL:-https://raw.githubusercontent.com/ignitinsharma/hiretivo/main/compose.production.yml}"
INSTALL_DIR="${HIRETIVO_DIR:-$HOME/hiretivo}"
IMAGE="${HIRETIVO_IMAGE:-$DEFAULT_IMAGE}"

fail() {
  printf 'Hiretivo did not start: %s\n' "$*" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || fail "Docker isn't installed. Install Docker Desktop (macOS or Windows) or Docker Engine with the Compose plugin (Linux), then run this again."
docker compose version >/dev/null 2>&1 || fail "Docker Compose isn't installed. Install Docker Desktop, or Docker Engine with its Compose plugin, then run this again."
docker info >/dev/null 2>&1 || fail "Docker isn't running. Start Docker Desktop (or the Docker service), then run this again."
command -v openssl >/dev/null 2>&1 || fail "OpenSSL isn't installed, and it's needed once to make secure secrets. Install it (on Debian or Ubuntu: sudo apt install openssl), then run this again."

# From a checkout, use the Compose file that came with it; in a pipe, download it.
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd || true)
if [ -n "${HIRETIVO_COMPOSE_FILE:-}" ]; then
  source_compose=$(CDPATH= cd -- "$(dirname -- "$HIRETIVO_COMPOSE_FILE")" && pwd)/$(basename -- "$HIRETIVO_COMPOSE_FILE")
elif [ -n "$script_dir" ] && [ -f "$script_dir/../compose.production.yml" ]; then
  source_compose=$script_dir/../compose.production.yml
elif [ -f ./compose.production.yml ]; then
  source_compose=$(pwd)/compose.production.yml
else
  source_compose=""
fi

mkdir -p "$INSTALL_DIR" || fail "Couldn't create the folder $INSTALL_DIR."
cd "$INSTALL_DIR" || fail "Couldn't open the folder $INSTALL_DIR."

if [ ! -f compose.yml ]; then
  if [ -n "$source_compose" ]; then
    cp "$source_compose" compose.yml || fail "Couldn't copy the Compose file into $INSTALL_DIR."
  else
    command -v curl >/dev/null 2>&1 || fail "curl isn't installed, and it's needed to download the Compose file. Install curl, then run this again."
    compose_tmp=$INSTALL_DIR/.compose.yml.tmp
    curl -fsSL -o "$compose_tmp" "$COMPOSE_URL" || { rm -f "$compose_tmp"; fail "Couldn't download the Compose file from $COMPOSE_URL. Check your internet connection, then run this again."; }
    mv "$compose_tmp" compose.yml || fail "Couldn't save the Compose file in $INSTALL_DIR."
  fi
  printf 'Saved the Compose file in %s.\n' "$INSTALL_DIR"
fi

first_run=0
if [ ! -f .env ]; then
  password=$(openssl rand -hex 12) || fail "Couldn't make a sign-in password."
  postgres_password=$(openssl rand -hex 24) || fail "Couldn't make a database password."
  secret=$(openssl rand -hex 32) || fail "Couldn't make the encryption secret."
  password_hash=$(printf '%s\n' "$password" | docker run --rm -i "$IMAGE" hash-password 2>/dev/null) || fail "Couldn't make the password hash. Check that $IMAGE can be downloaded, then run this again."
  case "$password_hash" in
    argon2*) ;;
    *) fail "The password hash came back in an unexpected form. Check that $IMAGE is the Hiretivo image, then run this again." ;;
  esac

  old_umask=$(umask)
  umask 077
  {
    printf 'COMPOSE_PROJECT_NAME=hiretivo\n'
    printf 'HIRETIVO_IMAGE=%s\n' "$IMAGE"
    printf 'HIRETIVO_PORT=%s\n' "${HIRETIVO_PORT:-3000}"
    printf 'POSTGRES_PASSWORD=%s\n' "$postgres_password"
    printf 'HIRETIVO_SECRET=%s\n' "$secret"
    printf "HIRETIVO_PASSWORD='%s'\n" "$password_hash"
  } > .env || { umask "$old_umask"; fail "Couldn't write the secrets file $INSTALL_DIR/.env."; }
  umask "$old_umask"
  chmod 600 .env
  first_run=1
fi

http_port=$(sed -n 's/^HIRETIVO_PORT=//p' .env | tail -n 1)
http_port=${http_port:-3000}

printf 'Starting Hiretivo. The first run downloads the image, so it can take a few minutes...\n'
if ! docker compose up -d --wait --wait-timeout 300; then
  printf '\nThe containers did not become ready. Their last lines:\n\n' >&2
  docker compose logs --tail 40 >&2 || true
  if [ "$first_run" = 1 ]; then
    printf '\nYour sign-in password is: %s\n' "$password" >&2
    printf 'Keep it: this run could not start, and a later run will not show it again.\n' >&2
  fi
  fail "read the messages above. If Docker was still downloading, run this command again."
fi

printf '\nHiretivo is running at http://localhost:%s\n' "$http_port"
if [ "$first_run" = 1 ]; then
  printf '\nSign in with this password: %s\n' "$password"
  printf 'Save it now: Hiretivo only keeps a hash, so it cannot show the password again.\n'
else
  printf 'This install was already set up; its password and data are unchanged.\n'
fi
printf '\nStop it with:  cd %s && docker compose stop\n' "$INSTALL_DIR"
printf 'Start it with: cd %s && docker compose start\n' "$INSTALL_DIR"
printf 'Remove it with: cd %s && docker compose down   (your data is kept until you add -v)\n' "$INSTALL_DIR"
