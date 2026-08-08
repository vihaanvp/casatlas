# Self-Hosting with Docker

This is the recommended deployment path. Docker Compose starts the app **and** a PostgreSQL 16 database as containers that talk to each other. The whole thing comes up with one command.

---

## 1. Get the code

Clone the repo onto the server (or wherever you want to operate from):

```bash
cd /opt   # or your preferred location
git clone https://github.com/vihaanvp/casatlas.git
cd casatlas
```

If you want to use the released image instead (no clone, no Node toolchain), see [Installing from GitHub Container Registry](#installing-from-ghcr-no-clone) below. Otherwise keep going.

---

## 2. Configure environment variables

There's a Docker-specific `.env.example` inside `docker/`. Copy it to `docker/.env`:

```bash
cd docker
cp .env.example .env
cd ..
```

> The compose file loads `docker/.env` (note: **inside the `docker/` directory**, not the repo root). It already points `DATABASE_URL` at the `db` service hostname — don't use the root `.env.example` here or the app won't reach the database.

Edit `docker/.env` and set **at minimum** these values:

```bash
# ─── Auth.js ─────────────────────────────────
# Generate with: openssl rand -base64 32
AUTH_SECRET=replace-me-with-a-strong-random-value

# ─── External URL ───────────────────────────
# Used for OAuth redirects. NO trailing slash.
NEXT_PUBLIC_APP_URL=https://cas.yourdomain.com

# ─── OAuth providers (see OAuth-Setup page) ──
# Leave empty to disable a provider.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

> **Never commit `.env`.** It's already in `.gitignore`. Treat the values inside as database passwords.

For the full reference of every env var, see [Configuration](Configuration).

---

## 3. Start the stack

```bash
cd docker        # the docker-compose.yml lives here
docker compose up -d
```

This:

1. Starts a **PostgreSQL 16** container (`docker-db-1`).
2. Pulls the pre-built `ghcr.io/vihaanvp/casatlas:latest` image (multi-arch — amd64 + arm64). To build from local source instead, use `docker compose up -d --build`.
3. Waits for the database to be healthy (5-second retries, up to 5 times).
4. Starts the app on `http://localhost:3000`.

To watch the logs:

```bash
docker compose logs -f app
```

To later restart only the app (after you edited `.env`, for example):

```bash
docker compose up -d --force-recreate app
```

To stop and remove everything (your data lives on two named volumes — `postgres_data` and `uploads_data` — and is preserved):

```bash
docker compose down
```

To **delete everything**, including the data:

```bash
docker compose down -v
```

---

## 4. Verify it works

In your browser:

1. Visit `http://<server-ip>:3000` — you should see the dark-mode login screen.
2. Click **Continue with Google** (or GitHub). Confirm the OAuth flow redirects you back.
3. You should land on `/dashboard` as a new user.

If `/dashboard` is empty, you've installed correctly. The **first account to sign in on a fresh install is automatically promoted to `ADMIN`** (see [Promoting your first admin](Configuration#promoting-your-first-admin)), so you should see the **Admin Panel** in the sidebar right away.

---

## 5. Put it behind HTTPS (recommended)

The container serves plain HTTP. In production, **you must terminate TLS externally** with one of:

- **Caddy** (simplest for a small instance — automatic Let's Encrypt):
  ```caddy
  cas.yourdomain.com {
      reverse_proxy localhost:3000
  }
  ```
- **Nginx** with [acme.sh](https://github.com/acmesh-official/acme.sh) for cert renewal
- **Cloudflare** in front of the app (free tier works fine)
- A managed reverse-proxy at your cloud provider

Then update `NEXT_PUBLIC_APP_URL` in `.env` accordingly and restart the app:

```bash
docker compose up -d --force-recreate app
```

---

## <a id="installing-from-ghcr-no-clone"></a>Installing from GHCR (no clone)

Every push to `main` publishes the image to GitHub Container Registry with the tag `latest` (plus `main` and a per-commit `sha-<commit>`). You can pull it directly and skip building from source.

The checked-in `docker/docker-compose.yml` **already uses the pre-built image** (`ghcr.io/vihaanvp/casatlas:latest`), so the normal flow works whether or not you cloned the source. To install without cloning, create your own compose file with just the two services:

```yaml
services:
  app:
    image: ghcr.io/vihaanvp/casatlas:latest
    env_file:
      - .env           # your docker/.env, see Step 2 above
    ports:
      - "3000:3000"
    environment:
      UPLOAD_DIR: /app/uploads
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: casatlas
      POSTGRES_USER: casatlas
      POSTGRES_PASSWORD: casatlas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U casatlas"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:
```

Pin a specific tag (`sha-<commit>` or a `vX.Y.Z` release, not `latest`) for reproducible deployments.

---

## Where to go next

- **Set up OAuth** → [OAuth Setup](OAuth-Setup)
- **All env vars explained** → [Configuration](Configuration)
- **Promote yourself to admin** → [Configuration#promoting-your-first-admin](Configuration#promoting-your-first-admin)
- **Back up your database** → [Operating CASAtlas](Operating-CASAtlas)
