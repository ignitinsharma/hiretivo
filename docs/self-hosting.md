# Self-hosting HireTivo

## What is stored locally

`compose.yaml` runs the app and PostgreSQL. The `postgres_data` Docker volume holds accounts, applications, base and tailored resume data, calendar entries, and encrypted provider credentials. The `uploaded_files` volume holds uploaded resume files. `.env.self-hosted` holds the database password, session secret, and encryption key. Keep all three together when moving an installation; the encrypted provider keys cannot be read without the original encryption key.

The app listens on `127.0.0.1:3000`. If you expose it to other machines, configure HTTPS, access controls, and backups for that deployment. The local installer does not configure a public server.

## Start and stop

Run `sh scripts/local-up.sh` from the repository root. It creates `.env.self-hosted` once, builds the app, starts PostgreSQL, and applies pending Prisma migrations when the app starts. Run `docker compose --env-file .env.self-hosted down` to stop containers while keeping both data volumes. Do not use `down -v` unless you intend to erase both volumes.

Manual job entry, the application tracker, calendar, dashboard, and base resume editor work without an AI key. For parsing and generation, choose a provider in Settings. Local models require a separately running OpenAI-compatible endpoint with `/v1/models` and `/v1/chat/completions`. The Docker host bridge is `host.docker.internal`. Cloud usage and charges are governed by the provider account you configure.

## Back up

Choose a directory outside the checkout so a repository cleanup cannot remove the backup:

```sh
sh scripts/local-backup.sh /path/to/private/hiretivo-backup
```

The script briefly stops the app, writes a PostgreSQL custom-format dump, copies uploaded files and `.env.self-hosted`, then restarts the app if it was running. It refuses to overwrite an existing backup directory. The backup contains personal data and secrets: store it privately, encrypt it at rest, and copy it off the machine. Check that `database.dump`, `env.self-hosted`, and `files/` are present.

## Restore or move an installation

Use a fresh checkout and the backup's original secrets. Before first start, copy `env.self-hosted` from the backup to `.env.self-hosted`, then run `sh scripts/local-up.sh`. This creates the containers and volumes with the original database password. Finally run:

```sh
sh scripts/local-restore.sh /path/to/private/hiretivo-backup --replace
```

Restore replaces all database records and uploaded files in that installation. The script refuses a backup whose secrets differ from the installation's `.env.self-hosted`. It stops the app, restores the database and files, and starts the app after both operations succeed. If restore fails, the app stays stopped; fix the error and rerun the command. Use the same PostgreSQL major version as the backup or test the restore on a separate installation first.

## Upgrade

1. Create a backup and keep it outside the repository.
2. Check out the desired release or pull its source changes.
3. Run `sh scripts/local-up.sh`. Compose rebuilds the app and reuses the existing `postgres_data` and `uploaded_files` volumes. Startup applies pending Prisma migrations.
4. Sign in and confirm an application, uploaded resume, and AI settings are present.

Keep `.env.self-hosted` and the Docker Compose project name unchanged across upgrades. A database migration may not be reversible; restoring a backup is the rollback path. Restore the backup with the release that created it, then upgrade again if needed.

## Migration boundaries

Moving between self-hosted machines uses the backup and restore process above. Automatic import of a managed HireTivo account is not available in this release. Hosted accounts may use OAuth, hosted file storage, and billing records that do not map directly to a fresh password-based installation. Keep the hosted deployment and its data until any required migration has been checked separately; manually recreate applications and upload resume files in the self-hosted edition when needed.
