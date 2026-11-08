#!/bin/sh
set -eu

base_url=${HIRETIVO_TEST_URL:-http://localhost:3000}
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
email="local-smoke-$(date +%s)@example.test"

unauth_status=$(curl -sS -o /dev/null -w '%{http_code}' "$base_url/dashboard")
test "$unauth_status" = 307

register_status=$(curl -sS -o "$test_dir/register.json" -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"$email\",\"password\":\"LocalTestPassword123\",\"name\":\"Local Test\",\"role\":\"SEEKER\"}" \
  "$base_url/api/auth/register")
test "$register_status" = 201

curl -sS -c "$test_dir/cookies" -b "$test_dir/cookies" \
  "$base_url/api/auth/csrf" > "$test_dir/csrf.json"
csrf_token=$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).csrfToken' "$test_dir/csrf.json")
curl -sS -c "$test_dir/cookies" -b "$test_dir/cookies" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$csrf_token" \
  --data-urlencode "email=$email" \
  --data-urlencode 'password=LocalTestPassword123' \
  --data-urlencode "callbackUrl=$base_url/dashboard" \
  "$base_url/api/auth/callback/credentials" > "$test_dir/login.txt"

auth_status=$(curl -sS -o /dev/null -w '%{http_code}' -b "$test_dir/cookies" "$base_url/dashboard")
test "$auth_status" = 200
curl -sS -b "$test_dir/cookies" "$base_url/api/auth/email-verification/status" > "$test_dir/verification.json"
node -e 'const body = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); if (body.data?.requiresVerification !== false) process.exit(1)' "$test_dir/verification.json"
onboarding_status=$(curl -sS -o /dev/null -w '%{http_code}' -b "$test_dir/cookies" "$base_url/seeker/onboarding")
test "$onboarding_status" = 307

if [ "${HIRETIVO_TEST_RESTART:-0}" = 1 ]; then
  docker compose --env-file .env.self-hosted restart db app
  persisted_status=0
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    persisted_status=$(curl -sS -o /dev/null -w '%{http_code}' -b "$test_dir/cookies" "$base_url/dashboard" || true)
    [ "$persisted_status" = 200 ] && break
    sleep 2
  done
  test "$persisted_status" = 200
fi

printf 'Local registration, password sign-in, route protection, and onboarding bypass passed.\n'
