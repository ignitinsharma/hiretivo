# Hosted Hiretivo

Maintainer-only reference for optional deployment and account-flow testing. Ordinary users should follow the Docker/ENV setup in [README.md](README.md). No public deployment is required for local use.

The hosted version is free to use. Each person creates an account and supplies their own AI and other provider API keys. Provider charges and limits are managed in those providers' accounts; Hiretivo has no checkout or subscription system.

## Deployment modes

`HIRETIVO_DEPLOYMENT_MODE=self-hosted` is the default. It keeps password-only ENV login and does not allow registration. Existing self-hosted data stays in the installation's database.

`HIRETIVO_DEPLOYMENT_MODE=hosted` enables email/password accounts, email verification through Resend, and password recovery. It requires PostgreSQL, a verified Resend sender, and an HTTPS public origin. It never accepts `HIRETIVO_PASSWORD` as account login.

The fresh hosted database is separate from the commercial Hiretivo app. No commercial users, passwords, or application data are imported.

## Hosted configuration

Set these values in the deployment environment or a private `.env` file:

```dotenv
HIRETIVO_DEPLOYMENT_MODE=hosted
HIRETIVO_PUBLIC_URL=https://hiretivo.com
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

The hosted Compose configuration uses the external PostgreSQL connection, persists generated files in a volume, and binds the app to localhost. Put an HTTPS reverse proxy in front of it. Forward the original HTTPS protocol and configure trustworthy client-IP forwarding for authentication throttling.

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

Before switching the live domain, verify signup, delivery through the configured Resend sender, verification and resend, login, password recovery, logout, and fresh-account onboarding. Confirm two accounts cannot access each other's data or files. Check the homepage, pricing guide, and sample screenshots on desktop and mobile.

The health endpoint is `/api/health`. Check authentication and background-job error logs after deployment without recording passwords, API keys, raw email tokens, or private documents.

## Test hosted accounts locally

Keep `HIRETIVO_DEPLOYMENT_MODE=hosted` and set `HIRETIVO_PUBLIC_URL=http://localhost:3000` in your local `.env`. Run `yarn dev`, then request a fresh verification email. Verification and password-reset links now open the local app. Open localhost links on the same computer running the app.

HTTP localhost, 127.0.0.1, and IPv6 loopback are accepted only in development. Production still requires an HTTPS public origin and secure session cookies. Set the deployed environment to `HIRETIVO_PUBLIC_URL=https://hiretivo.com`. Previously sent emails keep their old URLs; request new links after changing configuration.

For hosted-only credentials, copy `.env.hosted.example` to `.env` and follow this guide. The default Compose configuration intentionally runs self-hosted mode; use the hosted configuration for account testing.
