#!/bin/sh
# The production container's command (E12-3): bring the database up to date,
# load the built-in themes, then serve. If a step fails, the container stops
# with a non-zero exit code, so CapRover and Docker don't switch over to it.
set -eu

# An SQLite file that isn't on a volume lives in the container itself, and
# the next upgrade, which replaces the container, deletes it.
case "${DATABASE_URL:-}" in
  file:*)
    db=$(printf '%s' "${DATABASE_URL#file:}" | sed 's/?.*//; s#//*#/#g')
    dir=$db
    while [ "$dir" != / ] && ! awk -v dir="$dir" '$5 == dir { found = 1 } END { exit !found }' /proc/self/mountinfo; do
      dir=$(dirname "$dir")
    done
    if [ "$dir" = / ]; then
      echo "WARNING: the SQLite database, $db, isn't on a volume, so it's deleted with this container, at the next upgrade at the latest. Mount a volume on its folder, e.g. docker run -v hiretivo-data:$(dirname "$db") ..." >&2
    fi
    ;;
esac

cd /app/tools
case "${HIRETIVO_DEPLOYMENT_MODE:-self-hosted}" in
  hosted)
    if ! node scripts/hosted-auth-migrate.mjs; then
      echo "Hiretivo didn't start: hosted authentication migrations failed." >&2
      exit 1
    fi
    # Per-account app schemas are upgraded by instrumentation before requests.
    ;;
  self-hosted)
    if ! node node_modules/prisma/build/index.js migrate deploy; then
      echo "Hiretivo didn't start: applying the database migrations failed (see the error above). See Troubleshooting in the wiki: https://github.com/ignitinsharma/hiretivo/wiki/Troubleshooting" >&2
      exit 1
    fi
    if ! node seed.mjs; then
      echo "Hiretivo didn't start: loading the built-in themes failed (see the error above)." >&2
      exit 1
    fi
    ;;
  *)
    echo "Hiretivo didn't start: HIRETIVO_DEPLOYMENT_MODE must be hosted or self-hosted." >&2
    exit 1
    ;;
esac

cd /app
exec node server.js
