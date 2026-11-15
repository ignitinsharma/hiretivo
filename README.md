<p align="center"><img src="src/app/icon.svg" alt="Hiretivo" width="80" height="80"></p>
<h1 align="center">Hiretivo</h1>
<p align="center">Your profile, tailored resumes, and applications in one workspace.</p>
<p align="center"><a href="https://hiretivo.com">hiretivo.com</a> · <a href="HOSTING.md">Hosting guide</a> · <a href="LICENSE">AGPL-3.0 license</a></p>

Hiretivo helps you manage your job search: keep your career history in one profile, review how you match a job, create tailored resumes and cover letters, and track applications from draft to offer.

**Free to use. Bring your own API keys.** Hiretivo has no subscription or shared AI credits. Your chosen AI and job-search providers may charge for usage or impose limits. Manage those costs in their accounts.

The official domain is **https://hiretivo.com**. The deployed site can differ from the version in this repository until that version is deployed.

## Current account flow

1. **Create an account:** enter your email, password, and confirm password.
2. **Verify your email once:** open the email link and confirm verification. Links expire after 24 hours; request another if needed.
3. **Sign in:** use email and password. Verified accounts do not need another verification email at login. Unverified accounts must finish signup verification first.
4. **Set up your workspace:** follow the welcome guide, add your profile or import a resume, and connect your own cloud AI API key.
5. **Start an application:** paste a job link or description, review the generated documents, and track progress in Applications.

**Forgot your password?** Request a reset email from the login page. The single-use link expires in 30 minutes. Set a new password, then sign in again; existing sessions are revoked.

Self-hosted installations use a separate flow: sign in with `HIRETIVO_PASSWORD` from your ENV file. There is no signup or email verification in that mode.

## Screenshots

Screenshots show the current green Hiretivo interface. Career and application details belong to a fictional demo profile, not a real applicant. The workspace screens use the self-hosted demo; the account screens show hosted signup and login.

| Create an account | Sign in |
| --- | --- |
| ![Hiretivo signup with email, password, and password confirmation](.github/images/hiretivo-signup.png) | ![Hiretivo email and password login](.github/images/hiretivo-login.png) |

| Dashboard | Resume workspace |
| --- | --- |
| ![Hiretivo dashboard showing sample application progress](.github/images/hiretivo-dashboard.png) | ![Hiretivo resume workspace with document themes](.github/images/hiretivo-resume.png) |

| Applications | New application |
| --- | --- |
| ![Hiretivo application tracking with sample applications](.github/images/hiretivo-applications.png) | ![Hiretivo new application dialog](.github/images/hiretivo-new-application.png) |

## What you can do

- **Build your profile:** add experience, skills, education, projects, certifications, publications, and facts. Review any imported resume information.
- **Create documents:** tailor a resume and cover letter to a posting, refine the drafts, choose document themes, and download PDFs. Review AI output before using it.
- **Track applications:** keep documents, notes, statuses, and interview dates together.
- **Find opportunities:** configure supported job sources, explore Startups, and review fit scores and reasons.
- **Choose your AI:** hosted accounts use supported cloud providers with their own keys. Self-hosting also supports local models and custom OpenAI-compatible endpoints.
- **Use optional integrations:** configure Google Calendar/Gmail features or connect an MCP app. Review permissions and task data before enabling integrations.
- **Keep control of your data:** export application data and manage stored app data from Settings.

## Run locally with Docker

Install Git and Docker Desktop, or Docker Engine with Compose. Have at least 2 GB of available memory.

```sh
git clone https://github.com/ignitinsharma/hiretivo.git
cd hiretivo
cp .env.example .env
openssl rand -base64 32
```

Edit `.env`: choose a unique password and paste the generated secret. Do not commit this file.

```dotenv
HIRETIVO_DEPLOYMENT_MODE=self-hosted
HIRETIVO_PASSWORD=choose-a-long-unique-password
HIRETIVO_SECRET=paste-the-generated-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hiretivo
```

```sh
docker compose up -d --build
```

Compose starts PostgreSQL and sets the app's internal database address. The app generates its database clients, applies migrations, seeds built-in themes, and starts. Open **http://localhost:3000**, enter your ENV password, and follow the welcome guide.

```sh
docker compose logs --tail=100 app
docker compose stop
docker compose start
```

Stopping preserves database volumes. Removing volumes with `docker compose down -v` deletes their data. Keep backups.

### Use a local model

For the optional Ollama service in this Compose setup:

```sh
docker compose up -d ollama
docker compose exec ollama ollama pull qwen2.5:3b
```

In **Settings → AI provider**, choose Local model, enter `http://ollama:11434`, select the downloaded model, and test the connection. Local-model speed and memory requirements depend on your hardware. Local models are available in self-hosted mode, not through the hosted website.

## Test hosted signup locally

Use a **direct PostgreSQL connection**, a Resend API key, and a verified Resend sender. Hosted mode does not use the ENV login password.

```dotenv
HIRETIVO_DEPLOYMENT_MODE=hosted
HIRETIVO_PUBLIC_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE
HIRETIVO_SECRET=your-random-secret-of-at-least-32-characters
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=Hiretivo <noreply@hiretivo.com>
```

For development without Docker, use **Node 24.7 or newer** and the Yarn version pinned in `package.json`:

```sh
corepack enable
yarn install --immutable
yarn generate
yarn dev
```

Hosted startup prepares the shared authentication tables. Open **http://localhost:3000/signup** and follow the account flow above. HTTP loopback URLs are allowed only during development. Open localhost email links on the computer running the app. After changing the public URL, restart and request a fresh email; previously sent emails retain their original URLs.

For production, set `HIRETIVO_PUBLIC_URL=https://hiretivo.com` and use HTTPS. See [HOSTING.md](HOSTING.md) for the current Docker/Node deployment configuration. This README update does not change hosting or enable deployment.

## Configuration and development

- [ENV examples](.env.example): available configuration without real credentials.
- [Hosting](HOSTING.md): hosted accounts, direct database connections, migrations, and deployment modes.
- [Development](DEVELOPMENT.md): tooling and tests.
- [Privacy](PRIVACY.md) and [security](SECURITY.md): data handling and protection details.

The current backend uses an in-process job runner, schedules, and PDF browser. Its Docker/Node configuration expects one long-running application instance. Adapting those components for serverless hosting is separate work.

## License

Hiretivo is distributed under the [GNU Affero General Public License v3.0](LICENSE). Preserve license notices and third-party attribution when redistributing it. Bundled fonts retain their own licenses.
