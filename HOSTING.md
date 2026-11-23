# Hosted Hiretivo

The hosted version is free to use. Each person creates an account and supplies their own AI and other provider API keys. Provider charges and limits are managed in those providers' accounts; Hiretivo has no checkout or subscription system.

## Deployment modes

`HIRETIVO_DEPLOYMENT_MODE=self-hosted` is the default. It keeps password-only ENV login and does not allow registration. Existing self-hosted data stays in the installation's database.

`HIRETIVO_DEPLOYMENT_MODE=hosted` enables email/password accounts, email verification through Resend, and password recovery. It requires PostgreSQL, a verified Resend sender, and an HTTPS public origin. It never accepts `HIRETIVO_PASSWORD` as account login.

The fresh hosted database is separate from the commercial Hiretivo app. No commercial users, passwords, or application data are imported.

## Hosted configuration

Set these values in the deployment environment or a private `.env` file:

```dotenv
HIRETIVO_DEPLOYMENT_MODE=hosted
HIRETIVO_PUBLIC_URL=https://app.hiretivo.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE
HIRETIVO_SECRET=GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
RESEND_API_KEY=YOUR_RESEND_KEY
RESEND_FROM_EMAIL=Hiretivo <noreply@hiretivo.com>
```

Generate the secret with `openssl rand -base64 32`. Use a direct PostgreSQL connection, rather than a transaction-pooling URL: account provisioning uses DDL and session-level advisory locks, and tenant raw queries use the connection's search path. Use the database provider's required TLS connection settings. Configure the sender domain in Resend before sending verification or password-reset messages. Never expose these values in client code or logs.

The database role needs permission to create account schemas and their tables, indexes, and enum types, and to install the `citext` extension. Use a dedicated database for this installation.

For optional Google integration, configure `HIRETIVO_GOOGLE_CLIENT_ID` and `HIRETIVO_GOOGLE_CLIENT_SECRET`, and register the app's production callback URL in the Google console. These OAuth application credentials belong to the operator; users authorize their own Google connections.

## Run with Docker

```sh
docker compose -f compose.hosted.yml up -d --build
docker compose -f compose.hosted.yml logs --tail=100 app
```

The hosted Compose configuration uses the external PostgreSQL connection, persists generated files in a volume, and binds the app to localhost. Put an HTTPS reverse proxy in front of it. Forward the original HTTPS protocol. Overwrite the incoming `X-Forwarded-For` header with the observed client address at the trusted proxy so authentication throttling uses that address. Keep query strings out of proxy access logs because verification and reset links carry tokens.

Run one application instance. Background jobs, daily schedules, and PDF rendering use this process; this version does not provide a distributed worker queue.

For a direct Node deployment, use the Node version required in `package.json`, install dependencies, generate Prisma clients and the tenant schema bundle, run the hosted authentication migration, then build and start:

```sh
yarn install --immutable
yarn generate
yarn tenants:generate
yarn hosted:migrate
yarn build
yarn start
```

`yarn dev` and `yarn start` prepare the shared hosted authentication tables before Next.js starts. This step is skipped in self-hosted mode. You can also run `yarn hosted:migrate` explicitly. A failed preparation stops startup before account schemas are read.

## Accounts and isolation

Account identities, hashed email tokens, sessions, and rate limits live in shared authentication tables. Each verified account receives its own PostgreSQL schema for profile data, settings, API credentials, applications, documents, searches, Google connections, jobs, and usage. Application queries resolve a verified account before selecting a schema. Background tasks carry account identity explicitly.

The schema bundle is generated from the current Prisma schema and migration history. Regenerate it when changing that schema or adding migrations. Existing account schemas are upgraded on hosted startup; take a database backup before deploying schema changes.

API credentials remain encrypted with keys derived from `HIRETIVO_SECRET`. Keep that secret stable and backed up securely. Hosted accounts do not inherit operator AI or job-provider API keys.

Hosted AI supports the approved cloud providers. Local models and arbitrary OpenAI-compatible endpoints remain available in self-hosted mode. `/pricing#self-host` contains the user-facing installation and local-model setup guide.

## Release checks

Rehearse against a dedicated Neon database on an isolated branch. Use a separate persistent volume and deployment secret for the rehearsal. Before production, confirm the direct TLS connection targets the dedicated production database, confirm the configured Neon restore window, and test restoring to an isolated branch. Preserve the prior image and back up the application volume and deployment secret separately from PostgreSQL.

Use the same pinned source revision for rehearsal and production. Verify that forwarding-header spoofing cannot bypass signup throttling and that requests from different clients are attributed separately. Verify provider setup with dedicated test keys, job search, resume and cover letter generation, PDF download, and application tracking. Restart the app and check persistence. Record queue wait, generation time, and PDF render time separately.

Before publishing the app links on the marketing site, verify signup, delivery through the configured Resend sender, verification and resend, login, password recovery, logout, and fresh-account onboarding. Confirm two accounts cannot access each other's data or files. Check the homepage, pricing guide, and sample screenshots on desktop and mobile.

Once production checks pass, build the Vercel marketing site with `HIRETIVO_WEBSITE_HOSTED_LINKS=1 npm --prefix website run build` to publish the hosted login and signup links.

The health endpoint is `/api/health`. Check authentication and background-job error logs after deployment without recording passwords, API keys, raw email tokens, or private documents.

## Private Vercel app preview

Use a separate Next.js project with Vercel Authentication enabled and configure the hosted credentials for the Preview environment. Set `ENABLE_EXPERIMENTAL_COREPACK=1` for the build so Vercel uses the pinned Yarn version. Apply the hosted auth migration to an isolated direct PostgreSQL database before deploying. The preview uses its deployment URL as the public origin unless an explicit origin is configured.

Vercel Queues invokes the hosted job consumer, and clients poll the stored job state across function instances. Enable Protection Bypass for Automation on the preview project so the server-side Chromium renderer can open the protected print pages. Vercel uses temporary files under `/tmp`. Scheduled maintenance, durable backups, and bulk PDF archive storage require separate runtime work before relying on them in production.

## Test hosted accounts locally

Keep `HIRETIVO_DEPLOYMENT_MODE=hosted` and set `HIRETIVO_PUBLIC_URL=http://localhost:3000` in your local `.env`. Run `yarn dev`, then request a fresh verification email. Verification and password-reset links now open the local app. Open localhost links on the same computer running the app.

HTTP localhost, 127.0.0.1, and IPv6 loopback are accepted only in development. Production still requires an HTTPS public origin and secure session cookies. Set the deployed environment to `HIRETIVO_PUBLIC_URL=https://app.hiretivo.com`. Previously sent emails keep their old URLs; request new links after changing configuration.
