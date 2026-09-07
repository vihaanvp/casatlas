# Troubleshooting

If something doesn't work, check this page first. Most failures fall into a handful of categories.

---

## Sign-in problems

### "No authentication providers configured" on `/login`

Both `GOOGLE_CLIENT_ID` and `GITHUB_CLIENT_ID` are unset (or empty strings). Set at least one — see [OAuth Setup](OAuth-Setup).

After fixing, restart: `docker compose up -d --force-recreate app`.

### "redirect_uri_mismatch" from Google / "bad_verification_code" from GitHub

The callback URL in your OAuth console doesn't match `NEXT_PUBLIC_APP_URL + /api/auth/callback/{provider}` **exactly**. Recheck:

- Trailing slash vs no trailing slash
- http vs https
- A subdomain or path mismatch
- Whether you registered the **production** URL but are testing on **localhost** (or vice versa)

For each provider, the exact expected callback URL is shown in [OAuth Setup](OAuth-Setup).

### Infinite redirect loop on sign-in

Most often caused by a stale `AUTH_SECRET` mismatch. Sign out and clear cookies, then try again.

### Sign-in succeeds but the session drops after a moment

Check that `AUTH_SECRET` is set consistently across restarts. If you have multiple instances of the app, they all need to share the same `AUTH_SECRET` — Auth.js uses it to encrypt cookies, and a mismatch looks like tampering.

If the database connection is intermittent, sessions can also fail to record. Look at the logs:

```bash
docker compose logs app | grep -i 'database'
```

---

## Database problems

### App container exits immediately, logs say `FATAL: AUTH_SECRET is not set`

The entrypoint refuses to boot with a missing/placeholder secret. Copy `docker/.env.example` to `docker/.env` and set a real value (`openssl rand -base64 32`), then `docker compose up -d`.

### App container keeps restarting, logs say `Can't reach database server`

The `app` container can't reach the `db` container. Two common causes:

1. **Wrong `DATABASE_URL`.** If you customised it, the hostname must match the Postgres service name (`db` in the bundled compose file). `localhost` won't work because each container has its own network namespace.
2. **Postgres isn't healthy yet.** Check `docker compose ps` — the `db` container should be `(healthy)`, not `(health: starting)` or `unhealthy`.

```bash
docker compose ps       # see statuses
docker compose logs db  # see Postgres init logs
```

### Migration errors on startup

Look at:

```bash
docker compose logs app | grep -i 'prisma\|migrate'
```

If you see "Migration not found," you likely started from an old conflicting schema. The fix:

```bash
docker compose exec app pnpm exec prisma migrate deploy
```

If you see "relation `users` already exists," your Postgres volume already has data (probably from a previous run). CASAtlas treats this as fine — the migration is idempotent and only adds missing tables / columns. If the schema is genuinely inconsistent, see [the restore procedure](Operating-CASAtlas#restore-order) or open an issue.

### `permission denied for schema public` after upgrading Postgres

Postgres 15 changed the default `public` schema permissions. If you migrated from an older database version, run:

```sql
GRANT ALL ON SCHEMA public TO casatlas;
ALTER DATABASE casatlas OWNER TO casatlas;
```

Then restart the app.

---

## File upload problems

### Upload fails with `413 Payload Too Large`

The default limit is 50 MB. Two places enforce it:

- **Client:** `src/config/upload.ts` (`maxFileSize`). Edit and rebuild to change.
- **Server:** `next.config.ts` has `experimental.serverActions.bodySizeLimit: "50mb"` for Server Action-form uploads. For the `/api/upload` route, the multipart parser reads into memory (matches `maxFileSize`).

Both need updating together if you change the limit.

### Upload fails with `403 Forbidden` immediately

`/api/files/[...path]` checks access against the **experience ID** (second path segment, `{userId}/{experienceId}/{file}`): the requester must own the experience, be an assigned teacher, or be an admin. If you uploaded from account A but open the file as account B (unassigned), you'll get 403. This is by design.

If you're getting 403 on a file you uploaded yourself, your session likely expired — sign out and back in. If it persists, check that `UPLOAD_DIR` is what the `app` container thinks it is (`/app/uploads`, set explicitly in compose).

### Uploaded images / PDFs won't preview or download

Three past causes, all fixed — if you still hit this, check in order:

1. **Blank PDF frame:** older images sent `X-Frame-Options: DENY` on `/api/files/*`, which blocks the in-app preview `<iframe>`. Fixed in current builds (route now sends `SAMEORIGIN` + `frame-ancestors 'self'`, and the global policy was relaxed to match). `docker compose pull && docker compose up -d` to get the fix.
2. **No download button:** the evidence lightbox previously had no download affordance at all. Current builds have **Download** (saves with the original filename) and **Open in new tab** buttons in the lightbox header.
3. **Stale/corrupt cache:** file responses are now `private, max-age=3600, immutable` with explicit `Content-Length` and `Accept-Ranges: bytes` (video seeking + PDF viewers need ranges). Hard-refresh (`Ctrl+Shift+R`) once after upgrading.

### Files vanish on container recreation

You lose the `uploads_data` named volume only if you `docker compose down -v` (with `-v`). Without `-v`, volumes persist.

If you're using a host-path bind mount instead, the files are on your filesystem and unaffected by container lifecycle.

---

## Build / installation problems

### `pnpm install` complains about peer deps

The base versions in `package.json` are pinned to known-good ranges. If you bump a package (especially Prisma), you might need to bump its peer counterparts.

Specifically: **`@auth/prisma-adapter@2.11+` supports Prisma 7**. If you bump to a newer Prisma, check the adapter's peer-dependency range still includes it.

### `corepack enable` errors in Docker

The `Dockerfile` uses `node:20-alpine` (current LTS) because newer images (node:25+) remove bundled corepack, so `corepack enable` fails the build. Don't bump the base image without testing the `corepack enable` step first.

### `Dockerfile` cache export errors in CI

If you see:

```
Cache export is not supported for the "docker" driver
```

Make sure `.github/workflows/release.yml` includes a `docker/setup-buildx-action@v4` step **before** the build step. This was a known fix in the v0.1.1 cleanup.

---

## Database dump is suspiciously small

`pg_dump` with no `clean: false` flag drops `prisma_migrations`, but it shouldn't drop your data. If your restore comes back empty:

- Check you actually connected to the right database (`pg_dump -U casatlas casatlas` — note the last argument is the DB name)
- Check the SQL file isn't empty before restoring (`wc -l casatlas.sql`)
- Use `pg_dumpall` if you have multiple databases

---

## Local dev mode problems

### "Address already in use" on `pnpm dev`

Something else is on port 3000. Stop it (`docker compose down` if it's the stack, or `lsof -i :3000` to find a stray process).

### Hot reload doesn't pick up `prisma/schema.prisma` changes

You need to regenerate the client:

```bash
pnpm prisma generate
```

`postinstall` does this on `pnpm install` but doesn't watch for edits.

### Tests fail because of imports

Vitest reads `vitest.config.ts` for the `@/` alias. After moving files, restart `pnpm test:watch`.

If you accidentally imported server-only code into a test, you'll hit "PrismaClient is unable to be used in the browser." Tests run in Node, but they'd inherit any browser-only imports via the module graph.

---

## How to get help

1. Search the [Issue tracker](https://github.com/vihaanvp/casatlas/issues) — someone has hit your error before.
2. Read `docker compose logs app | tail -100` — paste (sanitized) error logs into the issue.
3. Include your deployment type (Docker, from source), CASAtlas version (`git describe --tags`), OS, and what you were doing when it broke.
4. For security, follow [SECURITY.md](https://github.com/vihaanvp/casatlas/blob/main/SECURITY.md) — both a GitHub advisory and direct email (`vihaan@vihaanvp.me`) are available.
5. For non-security bugs where you'd rather not open a public issue, you can also email the maintainer directly at [vihaan@vihaanvp.me](mailto:vihaan@vihaanvp.me). Public issues are preferred so others learn from the answer.
