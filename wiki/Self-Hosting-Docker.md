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

There's a checked-in `.env.example`. Copy it to `.env` (or create a new file):

```bash
cp .env.example .env
```

Edit `.env` and set **at minimum** these values:

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

1. Starts a **PostgreSQL 16** container, named `casatlas-db-1`.
2. Builds the `casatlas-app` image from the local `docker/Dockerfile` (multi-stage).
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
3. You should land on `/dashboard` as a new user with role `STUDENT`.

If `/dashboard` is empty, you've installed correctly. Now you need to [promote yourself to admin](Configuration#promoting-your-first-admin) so you can manage other users.

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

Every tagged release publishes an image to GitHub Container Registry. You can pull it directly and skip building from source.

A minimal `docker-compose.yml`:

```yaml
services:
  app:
    image: ghcr.io/vihaanvp/casatlas:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://casatlas:casatlas@db:5432/casatlas
      AUTH_SECRET: ${AUTH_SECRET:?AUTH_SECRET is required}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
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
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set a strong DB password}
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

Pick a specific tag (`v0.1.1`, not `latest`) for reproducible deployments.

---

## Where to go next

- **Set up OAuth** → [OAuth Setup](OAuth-Setup)
- **All env vars explained** → [Configuration](Configuration)
- **Promote yourself to admin** → [Configuration#promoting-your-first-admin](Configuration#promoting-your-first-admin)
- **Back up your database** → [Operating CASAtlas](Operating-CASAtlas)
