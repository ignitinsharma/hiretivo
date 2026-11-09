#!/bin/sh
set -eu

base_url=${HIRETIVO_TEST_URL:-http://127.0.0.1:3000}
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
email="local-files-$(date +%s)@example.test"

printf '%%PDF-1.7\nlocal file persistence smoke test\n' > "$test_dir/resume.pdf"
register_status=$(curl -sS -o "$test_dir/register.json" -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"$email\",\"password\":\"LocalTestPassword123\",\"name\":\"Local Files\",\"role\":\"SEEKER\"}" \
  "$base_url/api/auth/register")
test "$register_status" = 201

curl -sS -c "$test_dir/cookies" -b "$test_dir/cookies" "$base_url/api/auth/csrf" > "$test_dir/csrf.json"
csrf_token=$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).csrfToken' "$test_dir/csrf.json")
curl -sS -c "$test_dir/cookies" -b "$test_dir/cookies" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$csrf_token" \
  --data-urlencode "email=$email" \
  --data-urlencode 'password=LocalTestPassword123' \
  --data-urlencode "callbackUrl=$base_url/dashboard" \
  "$base_url/api/auth/callback/credentials" > "$test_dir/login.txt"

upload_status=$(curl -sS -o "$test_dir/upload.json" -w '%{http_code}' -b "$test_dir/cookies" \
  -F "file=@$test_dir/resume.pdf;type=application/pdf" "$base_url/api/resume/upload")
test "$upload_status" = 200
node -e 'const body = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); if (!body.data?.key?.startsWith("resumes/") || body.data.key.startsWith("data:")) process.exit(1)' "$test_dir/upload.json"

anonymous_status=$(curl -sS -o /dev/null -w '%{http_code}' "$base_url/api/upload/resume/file")
test "$anonymous_status" = 401
curl -fsS -b "$test_dir/cookies" "$base_url/api/upload/resume/file" > "$test_dir/download.pdf"
cmp "$test_dir/resume.pdf" "$test_dir/download.pdf"

docker compose --env-file .env.self-hosted restart db app
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS -b "$test_dir/cookies" "$base_url/api/upload/resume/file" > "$test_dir/download.pdf"; then
    ready=1
    break
  fi
  sleep 2
done
test "$ready" = 1
cmp "$test_dir/resume.pdf" "$test_dir/download.pdf"
printf 'Private resume upload and retrieval survived a container restart.\n'
