#!/bin/sh
set -eu

base_url=${HIRETIVO_TEST_URL:-http://127.0.0.1:3000}
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
email="local-generation-$(date +%s)@example.test"

register_status=$(curl -sS -o "$test_dir/register.json" -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"$email\",\"password\":\"LocalTestPassword123\",\"name\":\"Local Generation\",\"role\":\"SEEKER\"}" \
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

curl -fsS -b "$test_dir/cookies" "$base_url/api/resume/base" > "$test_dir/base.json"
node -e 'const fs = require("fs"); const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.stdout.write(JSON.stringify({ resumeJson: body.data.resumeJson }));' "$test_dir/base.json" > "$test_dir/base-put.json"
base_status=$(curl -sS -o "$test_dir/base-saved.json" -w '%{http_code}' -b "$test_dir/cookies" \
  -X PUT -H 'Content-Type: application/json' --data-binary "@$test_dir/base-put.json" "$base_url/api/resume/base")
test "$base_status" = 200

job_status=$(curl -sS -o "$test_dir/job.json" -w '%{http_code}' -b "$test_dir/cookies" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Engineer","company":"Local Company","pastedText":"Build local software with TypeScript and PostgreSQL for a distributed team and maintain the product architecture.","previewOnly":false}' \
  "$base_url/api/seeker/apply/from-link")
test "$job_status" = 200
application_id=$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).applicationId' "$test_dir/job.json")
test -n "$application_id"

generate_status=$(curl -sS -o "$test_dir/generate.json" -w '%{http_code}' -b "$test_dir/cookies" \
  -X POST "$base_url/api/applications/$application_id/generate")
test "$generate_status" = 412
node -e 'const body = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); if (body.error !== "model_not_configured") process.exit(1)' "$test_dir/generate.json"
printf 'Manual job persisted without AI; generation requests model setup without changing the application.\n'
