# HireTivo

HireTivo is a self-hosted job application tracker and resume workspace. It keeps application history, an interview and deadline calendar, a weekly dashboard, and an editable base resume with multiple PDF themes. You can use a local model or bring your own OpenRouter, OpenAI, Anthropic, or Google AI Studio API key.

## Start locally

Install Docker Desktop or another Docker Compose installation, then run:

```sh
sh scripts/local-up.sh
```

Open <http://localhost:3000> and create an account with an email address and password. The installer creates private secrets in `.env.self-hosted`; `.env.self-hosted.example` lists the required names without real secrets. Keep the actual file private. The app binds to localhost, and Postgres and uploaded resumes live in Docker volumes.

In **Settings → AI model**, select your provider. A model is optional for manual job tracking and base resume editing. AI parsing and tailored resume generation require a configured model. Local inference requires a separately running OpenAI-compatible server; HireTivo does not install or start one. In Docker, connect through `host.docker.internal`, for example `http://host.docker.internal:11434/v1`. Local and direct cloud providers parse text-based PDFs; scanned PDFs need a model with file input. Cloud providers receive the resume and job content you send for AI tasks. Provider API keys are encrypted in the local database.

See [Self-hosting guide](docs/self-hosting.md) for backup, restore, upgrade, and migration steps.

## Develop

HireTivo uses Next.js, TypeScript, Prisma, and PostgreSQL. Install Node.js 22 and pnpm 10, then run `pnpm install`. Development requires a PostgreSQL `DATABASE_URL` and an `AUTH_SECRET`; self-hosted development also needs `NEXT_PUBLIC_SELF_HOSTED=true` and `HIRETIVO_ENCRYPTION_KEY`. Run `pnpm exec prisma migrate deploy`, then `pnpm dev`. Docker Compose is the supported one-command local installation.

The self-hosted edition does not require a HireTivo subscription, OAuth account, email service, or hosted job feed. Managed hosting and billing remain separate from the self-hosted experience.

## License

HireTivo is released under the [MIT License](LICENSE). Its Dossier-inspired features and appearance are independently implemented; Dossier source code and assets are not included.
