# Self-Hosting from Source

Use this path if you can't run Docker, or you're hacking on the code and want to run it live. You'll need:

- **Node.js 20 or 22**
- **pnpm 9.x** — install with `npm i -g pnpm` or via [corepack](https://nodejs.org/api/corepack.html)
- **PostgreSQL 16+** running somewhere reachable

---

## 1. Clone and install

```bash
git clone https://github.com/vihaanvp/casatlas.git
cd casatlas
pnpm install
```

The `postinstall` hook in `package.json` runs `prisma generate` automatically, so the database client is ready to go after install.

> **Use pnpm 9.x.** pnpm 10+ removed support for the `pnpm.overrides` field in `package.json` (it moved to `pnpm-workspace.yaml`). CASAtlas still uses overrides to patch the `postcss` advisory, so pin pnpm to 9.

Other versions of pnpm will print a warning every run but still work — eventually that warning will become a problem.

---

## 2. Set up the database

If you have PostgreSQL running locally, create a database and user:

```bash
sudo -u postgres psql
postgres=# CREATE DATABASE casatlas;
postgres=# CREATE USER casatlas WITH ENCRYPTED PASSWORD 'casatlas_dev';
postgres=# GRANT ALL PRIVILEGES ON DATABASE casatlas TO casatlas;
postgres=# \q
```

(Use a more serious password in real use. The default in `docker-compose.yml` is `casatlas` so the local dev experience matches the container one.)

You can also point at any managed Postgres you have — Neon, Supabase, RDS, etc. Just give the app a working `DATABASE_URL`.

---

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

`.env.local` is gitignored. Set at minimum:

```bash
DATABASE_URL=postgresql://casatlas:casatlas_dev@localhost:5432/casatlas
AUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

OAuth is optional in dev — you can sign in without providers by hard-coding a session, but the easiest path is to plug in Google and/or GitHub (see [OAuth Setup](OAuth-Setup)).

---

## 4. Run database migrations

```bash
pnpm prisma migrate deploy
```

`migrate deploy` is the production-safe command — it applies existing migrations without creating new ones. During development you'd use `pnpm prisma migrate dev` to author migrations.

Generate the client (only if `pnpm install` didn't do it):

```bash
pnpm prisma generate
```

---

## 5. Start the app

**Development mode** — hot reload, full debugger:

```bash
pnpm dev
```

**Production mode** — build then run:

```bash
pnpm build
pnpm start
```

Both bind to `http://localhost:3000` by default.

---

## 6. Run the quality gates

Before committing anything:

```bash
pnpm lint          # ESLint via eslint .
pnpm type-check    # tsc --noEmit
pnpm test          # Vitest (89 tests in src/**/*.test.ts)
```

CI on `main` runs all three in addition to `pnpm build` and a full Docker build. Your PR should pass them locally before you push.

---

## Common environment tweaks

| Variable | Purpose |
|----------|---------|
| `PORT` | Port the app listens on. Default is 3000. |
| `HOSTNAME` | Bind address. Default is `0.0.0.0`. Set to `127.0.0.1` to restrict to localhost. |
| `UPLOAD_DIR` | Where uploaded evidence is stored. Default is `./uploads`. If you change this, make sure the directory is writable by the app process. |

---

## Production hardening checklist

If you're running from source in production (not Docker), make sure:

- The app process runs as a non-root user
- `UPLOAD_DIR` is on a disk that's [backed up](Operating-CASAtlas#backups)
- The database is **not** on `localhost:5432` without a firewall — bind Postgres to `127.0.0.1` only
- A reverse proxy terminates TLS
- Logs go somewhere you can read them — `pm2`, `systemd`, Docker, whatever

---

## Where to go next

- **Configure OAuth** → [OAuth Setup](OAuth-Setup)
- **All env vars explained** → [Configuration](Configuration)
- **Backups and maintenance** → [Operating CASAtlas](Operating-CASAtlas)
- **Want to modify code?** → [Developer Guide](Developer-Guide)
