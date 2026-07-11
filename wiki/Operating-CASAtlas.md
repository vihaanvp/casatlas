# Operating CASAtlas

Once CASAtlas is running, there are a handful of recurring ops tasks. This page is for whoever is maintaining the deployment.

---

## Backups

CASAtlas state lives in two places:
- The **PostgreSQL database** — users, experiences, comments, audit logs
- The **`uploads/` directory** — evidence files (images, videos, PDFs)

You must back up **both**, ideally to a different machine, ideally automated.

### Database backups

The cleanest method is `pg_dump`. For Docker Compose:

```bash
# One-shot snapshot
docker compose exec -T db pg_dump -U casatlas casatlas > /backups/casatlas-$(date +%F).sql

# Compress it
docker compose exec -T db pg_dump -U casatlas casatlas | gzip > /backups/casatlas-$(date +%F).sql.gz
```

For from-source Postgres:

```bash
pg_dump "$DATABASE_URL" | gzip > /backups/casatlas-$(date +%F).sql.gz
```

To **restore**:

```bash
gunzip -c casatlas-2026-07-11.sql.gz | \
  docker compose exec -T db psql -U casatlas casatlas
```

Automate with cron / systemd-timer / your existing backup product. Daily is fine for most schools; weekly is the minimum.

### File uploads backups

If you mounted `uploads/` as a named Docker volume (`uploads_data`), back it up directly:

```bash
docker run --rm \
  -v casatlas_uploads_data:/data:ro \
  -v /backups:/backup \
  alpine tar czf /backup/casatlas-uploads-$(date +%F).tar.gz -C /data .
```

If you mount a host path instead (`-v /var/lib/casatlas/uploads:/app/uploads` in your compose file), the path is already on your filesystem and can use whatever backup mechanism you already use.

### Restore order

If you need to restore after a disaster:

1. Restore the database first (`psql`).
2. Restore the uploads volume second.
3. Restart the app so it re-runs migrations on top of the restored schema (should be a no-op): `docker compose up -d --force-recreate app`.

If you restore to a newer app version, the migration will run on startup — this is safe and idempotent.

---

## Rotating secrets

### `AUTH_SECRET`

```bash
NEW_SECRET="$(openssl rand -base64 32)"
echo "NEW_SECRET=$NEW_SECRET" >> .env
```

Then update the `AUTH_SECRET` line in `.env` and restart:

```bash
docker compose up -d --force-recreate app
```

> All users will be signed out. They just log back in.

### OAuth client secrets

Regenerate in the provider's console, update both env vars, restart. Sessions persist (the secret only signs them; rotating it forces a re-issue).

### Database password

1. `ALTER USER casatlas PASSWORD '...newone...';` while connected as a Postgres superuser.
2. Update `DATABASE_URL` in `.env`.
3. Restart the app.

---

## Upgrading

### Docker image upgrades

```bash
# Pull the new image and rebuild
cd /path/to/casatlas
git pull
docker compose pull app      # if using the GHCR image instead of local build
docker compose up -d --force-recreate app
```

The app runs migrations on startup (via `prisma generate` baked into the image and `prisma migrate deploy` at boot). If the new version includes schema changes, the migration will run automatically.

If you're using the GHCR image, update your compose file to a new tag before pulling.

### Major upgrades

Read the [CHANGELOG](https://github.com/vihaanvp/casatlas/blob/main/CHANGELOG.md) before any major version bump. The v0.1 → v0.2 releases will list breaking changes (env var renames, schema migrations that need manual review, etc.).

There's currently no auto-update mechanism — you upgrade on your schedule.

---

## Viewing logs

### Docker Compose

```bash
docker compose logs -f app      # tail the app
docker compose logs -f db       # tail the database
docker compose logs --since=1h  # last hour
```

### From source

`pnpm dev` or `pnpm start` logs go to stdout. Use `pm2`, `journalctl`, or your favourite supervisor.

### Audit log

For structured application-level events (sign-ins, experience lifecycle, role changes), use `/admin/audit` in the UI as an admin. The underlying data is in the `audit_logs` table.

---

## Storage usage

To see roughly how much space your uploads use:

```bash
docker compose exec app du -sh /app/uploads
```

For from-source installations:

```bash
du -sh "$UPLOAD_DIR"
```

If uploads get large, consider:

- **Mounting the volume on a separate disk**
- **Implementing cloud storage** (S3-compatible — see [the roadmap](Features#whats-deliberately-out-of-scope-for-now))
- **Pruning** — soft-deleted experiences and their evidence are cleaned up after 30 days via the next major release

---

## Decommissioning

When you stop running CASAtlas, don't forget:

```bash
# Stop the containers but keep data
docker compose down

# Wipe everything if you're sure
docker compose down -v

# Remove the image (saves disk)
docker image rm casatlas-app
```

If you want your users' data to be portable, do this **first**:

```bash
docker compose exec -T db pg_dump -U casatlas casatlas > casatlas-final.sql
docker run --rm -v casatlas_uploads_data:/data -v $PWD:/backup alpine \
  tar czf /backup/uploads-final.tar.gz -C /data .
```

These two files are everything. They can be restored with the procedure in [restore order](#restore-order) above.

---

## What CASAtlas does *not* do for you

A reminder, so you're not surprised later:

- ❌ No automatic database backups. You run them.
- ❌ No automatic OS / dependency security patching. Dependabot opens PRs; you merge.
- ❌ No email alerts (CPU, memory, disk, app crashes). Wire your own monitoring (Prometheus, Grafana, Healthchecks.io, etc.)
- ❌ No scheduled migrations. They happen on container boot.
- ❌ No UI-based admin promotion (see [the first-admin dance](Configuration#promoting-your-first-admin)).

If you want any of these, file an issue.
