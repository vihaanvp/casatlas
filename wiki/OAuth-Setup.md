# OAuth Setup

CASAtlas doesn't have its own username/password system — sign-in is delegated to **Google** and/or **GitHub** through Auth.js. You configure which providers are enabled by setting the env vars (see [Configuration](Configuration)). At least one provider must be enabled for anyone to sign in.

This page walks you through registering each provider. You'll need access to your own Google Cloud / GitHub account.

---

## Common setup

Two values apply regardless of which provider you enable:

- **`NEXT_PUBLIC_APP_URL`** must be set to the **exact URL** your users visit, with no trailing slash (`https://cas.yourdomain.com`, not `https://cas.yourdomain.com/`). The same URL goes into the provider's authorized redirect list.
- **`AUTH_SECRET`** is the encryption key Auth.js uses for sessions and CSRF tokens. Generate it once and don't change it (changing it logs everyone out):
  ```bash
  openssl rand -base64 32
  ```
  Or via Python:
  ```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

---

## Google OAuth

### 1. Create the OAuth client

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create (or pick) a project.
2. **APIs & Services → OAuth consent screen.**
   - User type: **External** (unless your school uses a Google Workspace organisation with appropriate access)
   - App name: anything (`CASAtlas for Lincoln High` is fine)
   - Scopes: leave defaults — `openid`, `email`, `profile`, that's it
   - Add a **support email** and the **authorised domains** (e.g. `yourdomain.com`)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID.**
   - Application type: **Web application**
   - Name: `CASAtlas` (or anything)
   - **Authorised redirect URIs:**
     ```
     https://cas.yourdomain.com/api/auth/callback/google
     ```
     For local dev it's:
     ```
     http://localhost:3000/api/auth/callback/google
     ```

### 2. Configure CASAtlas

Set in your `.env` (or whatever you use):

```bash
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

Restart the app. The "Continue with Google" button appears on the login page automatically — Auth.js reads the env var via `modules/auth/auth.ts`.

> **Account linking:** if a user signs in with Google and then signs in with GitHub using the same email, Auth.js will link the two providers to the same internal user. They show up as two rows in the `accounts` table, one `users` row.

---

## GitHub OAuth

### 1. Register the OAuth app

1. Open **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** `CASAtlas` (or anything)
   - **Homepage URL:** `https://cas.yourdomain.com`
   - **Authorization callback URL:**
     ```
     https://cas.yourdomain.com/api/auth/callback/github
     ```
     For local dev:
     ```
     http://localhost:3000/api/auth/callback/github
     ```
3. Click **Register application**. You'll see a Client ID immediately; generate a Client secret on the same page.

### 2. Configure CASAtlas

```bash
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=the-long-hex-string
```

Restart. The "Continue with GitHub" button appears on the login page.

---

## Multi-tenant or single-org deployments

If you're running CASAtlas inside a single school, you may want to restrict sign-ins to a specific Google Workspace domain or a specific GitHub organisation. That's currently a code change — there's no admin-toggle UI for it. The change is in `src/modules/auth/auth.ts`:

```ts
Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  hd: "your-school.org", // restrict Google sign-ins to this Workspace domain
})
```

For organisations that want only-GitHub sign-ins from a specific org, the Auth.js GitHub provider supports `authorization.params.allowed_orgs`.

You'll need to rebuild and redeploy for these changes to take effect.

---

## Disabling open registration

By default, anyone who can reach the OAuth provider screen can complete sign-in. To restrict new account creation, set:

```bash
ALLOW_REGISTRATION=false
```

When set to `false`:

- The `/register` page shows a "Registration disabled" message.
- Sign-in attempts by users without an existing account return an error.
- Existing users can still sign in normally.

> ⚠️ **Bootstrap warning.** Before you set `ALLOW_REGISTRATION=false`, make sure **at least one user** is already promoted to `ADMIN` — see [Configuration#promoting-your-first-admin](Configuration#promoting-your-first-admin). Otherwise no one can manage the instance.

---

## Common OAuth errors

| Symptom | Cause |
|---------|-------|
| Redirect to `/auth/error?error=...` | Wrong client secret, or the callback URL in your OAuth console doesn't match `NEXT_PUBLIC_APP_URL` + `/api/auth/callback/{provider}` exactly |
| "No authentication providers configured" on `/login` | Neither `GOOGLE_CLIENT_ID` nor `GITHUB_CLIENT_ID` is set, or both are empty strings |
| Redirect loops on sign-in | Wrong `AUTH_SECRET` is most likely; cookies get stale. Clear them and try again. |
| Google says "App is not verified" | You're using the basic scopes (default). For a school deployment, submit Google's verification form or restrict via `hd`. |

If your error isn't on this list, see [Troubleshooting](Troubleshooting).

---

## Where to go next

- **Deploy with OAuth ready** → [Self-Hosting with Docker](Self-Hosting-with-Docker)
- **What env vars exist beyond OAuth?** → [Configuration](Configuration)
- **Promote yourself to admin after first sign-in** → [Configuration#promoting-your-first-admin](Configuration#promoting-your-first-admin)
