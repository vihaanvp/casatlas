# Self-Hosting Overview

CASAtlas is built to be self-hosted. You can run it on anything from a Raspberry Pi to a school server in the cloud. This page helps you pick the right deployment path before you start.

---

## Two paths

| Path | Best when |
|------|-----------|
| [**Docker (recommended)**](Self-Hosting-with-Docker) | You have a Linux server, a VPS, or a NAS that runs Docker. One command brings up the app and a PostgreSQL database together. This is what 95% of self-hosters want. |
| [**From source**](Self-Hosting-From-Source) | You want to modify the code, or you can't run Docker. You bring your own PostgreSQL and run `pnpm install && pnpm dev` or `pnpm build && pnpm start`. |

Both paths give you the same application — Docker just packages it more conveniently. Pick the one that fits your setup.

---

## What you'll need

CASAtlas is light. A modest setup is enough:

**Minimum (work for personal use, 1–5 users)**
- 1 CPU core
- 1 GB RAM
- 5 GB disk for the database + uploads
- A public HTTPS endpoint (or a reverse proxy on your home network)

**Recommended (school deployment, 50–200 users)**
- 2–4 CPU cores
- 4 GB RAM
- 50 GB disk (uploads will eat space)
- Managed PostgreSQL or a properly backed-up local one
- A reverse proxy with TLS (Caddy, Nginx, or your cloud provider's)

**Software requirements**

- **Docker 24+ and Docker Compose v2**, *or*
- **Node.js 20+ and pnpm 9+** (for the from-source path)
- **PostgreSQL 16+** reachable from the app — Docker Compose starts one automatically

---

## What you should decide before you start

| Question | Why it matters |
|----------|----------------|
| What URL will users visit? (`https://cas.yourdomain.com`) | Goes into `NEXT_PUBLIC_APP_URL` **and** the OAuth callback URLs |
| Which OAuth providers do you want to enable? (Google, GitHub, both, none for testing) | You need to register OAuth apps first; see [OAuth Setup](OAuth-Setup) |
| Who will be the **first admin**? | There's no self-service "become admin" — see [the bootstrap step](Configuration#promoting-your-first-admin) |
| Where will uploaded files live? | Default: a Docker volume. You can mount a host directory if you prefer backups via your filesystem |
| Will you back up the database? | Yes. See [Backups](Operating-CASAtlas#backups). Lost DB = lost CAS records that aren't trivially recoverable otherwise. |

---

## What's already taken care of

You don't need to do any of this — it's already wired up:

- HTTPS / HSTS / Content-Security-Policy headers are set in code (`next.config.ts`)
- Database migrations run automatically when the container starts (via the `postinstall` step)
- Audit logs of every meaningful action
- Soft-delete on experiences (you have 30 days to recover before they vanish for real)

---

## What isn't taken care of

A few things you should plan for:

- **TLS termination.** The container speaks HTTP. Put Caddy, Nginx, Cloudflare, or your cloud's load-balancer in front.
- **Backups.** No SaaS is backing up your database. Set it up day one.
- **Email.** CASAtlas doesn't send email (no SMTP). Notifications are in-app only.
- **Updates.** New releases are Docker images. Upgrade on your schedule — there's no forced upgrade.

---

## Where to go next

- **Docker users** → [Self-Hosting with Docker](Self-Hosting-with-Docker)
- **From source** → [Self-Hosting from Source](Self-Hosting-from-Source)
- **Need OAuth setup first** → [OAuth Setup](OAuth-Setup)
- **Ready to deploy** but not sure what every env var does → [Configuration](Configuration)
