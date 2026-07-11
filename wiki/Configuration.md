# Configuration

CASAtlas is configured through environment variables. There's no in-app settings page that controls infrastructure-level concerns (registration, file size limits, theme defaults come from code).

This page lists every variable, what it does, and what sensible values look like.

---

## Required variables

The app will refuse to start without these.

### `DATABASE_URL`
A standard PostgreSQL connection string.

```bash
DATABASE_URL=postgresql://casatlas:casatlas@localhost:5432/casatlas
```

For Docker Compose, the bundled `docker-compose.yml` points at the `db` service:

```bash
DATABASE_URL=postgresql://casatlas:casatlas@db:5432/casatlas
```

For managed databases (Neon, Supabase, RDS), use the provider's pooler URL. If your provider requires SSL, append `?sslmode=require`.

### `AUTH_SECRET`
32+ random bytes, base64-encoded. Used by Auth.js for CSRF tokens and session cookie encryption.

```bash
AUTH_SECRET="$(openssl rand -base64 32)"
```

> ⚠️ **Do not rotate this casually.** Changing it invalidates every user's session cookie. They'd just have to log in again — annoying but not destructive. Don't ship the same secret across multiple instances of the same app, though — that's an actual security issue.

---

## OAuth variables

You need **at least one** provider to be set, otherwise no one can sign in. Both providers can coexist.

| Variable | Format |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Looks like `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Looks like `GOCSPX-...` |
| `GITHUB_CLIENT_ID` | Looks like `Iv1.abc123def456` |
| `GITHUB_CLIENT_SECRET` | A long hex string |

See [OAuth Setup](OAuth-Setup) for how to obtain these.

---

## Application variables

### `NEXT_PUBLIC_APP_URL`
The full URL your users visit - **no trailing slash**:

```bash
NEXT_PUBLIC_APP_URL=https://cas.yourdomain.com
```

- Used for OAuth callback URLs (the provider's "Authorised redirect URI" must match this + `/api/auth/callback/{provider}`)
- Generated links in the app (password reset, share links, etc.) — note the app doesn't generate many links, so most things still work even if this is wrong, but OAuth logins **will break**.

### `ALLOW_REGISTRATION`
Open registration by default.

```bash
ALLOW_REGISTRATION=true   # default
ALLOW_REGISTRATION=false  # restrict to existing users only
```

See [OAuth Setup](OAuth-Setup) for side effects.

---

## Storage variables

### `UPLOAD_DIR`
Where evidence files go on disk. Defaults to `./uploads`. In Docker, the bundled compose file sets this to `/app/uploads` and mounts a named volume (`uploads_data`) there.

```bash
UPLOAD_DIR=/var/lib/casatlas/uploads
```

Make sure the directory exists **and is writable** by the app process. Inside Docker this happens automatically (the image creates it owned by the `nextjs` non-root user).

### `MAX_FILE_SIZE`
**Code-defined, not env-driven.** See `src/config/upload.ts`:

- 50 MB per file
- Allowed types: JPEG / PNG / GIF / WebP, MP4 / WebM, PDF

If you want to change these limits for your deployment, edit the config and rebuild the image. We don't expose them as env vars yet because the limit is also enforced client-side in the `react-dropzone` validation.

---

## <a id="promoting-your-first-admin"></a>Promoting your first admin

There is no in-app "register as admin" flow. New OAuth sign-ups always get role **`STUDENT`**. To bootstrap the first admin:

1. Sign in once with the OAuth provider of your choice.
2. Connect to the database and promote that user:
   ```bash
   docker compose exec db psql -U casatlas casatlas
   ```
   Then in the psql prompt:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
   \q
   ```
   For from-source Postgres:
   ```bash
   psql "$DATABASE_URL" -c "UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';"
   ```

3. Sign out, sign back in (the role is loaded from the database on each sign-in via the `jwt` callback in `modules/auth/auth.ts`).
4. You should now see the **Admin Panel** link in the sidebar.

After the first admin exists, additional admins can be promoted through `/admin/users` in the UI.

> **Why this dance?** Self-service admin promotion is a security hole — anyone could grab an OAuth account, hit "promote me," and own the instance. This way, only someone who can run SQL against the database (i.e. you, the operator) can.

---

## Teacher assignments

Teachers can't review any experiences by default. They must be **assigned** to one or more students first.

To assign students to a teacher:

1. Promote a user to `TEACHER` via `/admin/users`.
2. Visit `/admin/assignments`.
3. Pick a teacher in the dropdown, then check the students you want them to supervise.
4. Click **Save**. The relationship is recorded in the `teacher_students` join table.

Assignments are **replaced**, not merged — each save overwrites the teacher's full list of students. There's no UI for adding one student at a time yet.

---

## Theme defaults and user-level prefs

Theme defaults are **code-side** in the Prisma schema (`Theme` enum defaults to `DARK` in `UserSettings`). Per-user theme is persisted in `user_settings` rows and toggled via `next-themes` in the browser.

Accessibility settings (reduced motion, larger fonts, etc.) live in `localStorage`, not the database. They're per-browser, not per-user.

---

## What's NOT configurable yet

A backlog of features we'd like to expose eventually:

- **File size limits** — 50 MB is hardcoded for now
- **Email notifications** — none yet; everything is in-app
- **Custom themes / branding** — only emerald accent + dark/light
- **Multi-tenant** — one instance per deployment
