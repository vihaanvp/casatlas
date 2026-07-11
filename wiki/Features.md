# Features

This page walks through every feature in CASAtlas from a user's perspective. It tells you **what each thing is** and **how to use it**. Configuration details for admins live separately in [Configuration](Configuration) and [Operating CASAtlas](Operating-CASAtlas).

---

## For students

### Dashboard
**Where:** `/dashboard`

The home page once you sign in. Shows you at a glance:

- Total experiences and hours logged
- Status breakdown — drafts, submitted, approved, archived
- **Strand progress** — bars for Creativity / Activity / Service showing your distribution
- **Learning outcomes** — how many of the 7 IB learning outcomes you've touched through `SUBMITTED` or `APPROVED` experiences
- **Continue working** — your 5 most recent drafts, click straight back into editing
- **Recent activity** — created, updated, and revision events from the last few sessions
- **Quick actions** — new experience, search, timeline

### Experiences
**Where:** `/experiences`

Your full list of experiences with filters:

- By **status** (draft, submitted, approved, needs revision, archived)
- By **strand** (Creativity / Activity / Service)
- By **learning outcome**
- Free-text **search** over title and description

You can also switch between a list view and a timeline view (`?view=timeline`).

### Creating an experience
**Where:** `/experiences/new`

A single form with everything the IB asks for:

- **Title, date, description** — the basics
- **CAS strands** — check at least one
- **Learning outcomes** — check the outcomes the experience demonstrates
- **Reflection** — a long-form rich-text editor
- **Hours, location, supervisor** — supplementary metadata the IB wants
- **Group admission** — flag shared experiences
- **Evidence** — drop in photos, videos, PDFs, or external links

The form **autosaves as you type**. You don't need a Draft button — your work is preserved automatically every keystroke. To submit for teacher review, hit the explicit **"Submit for review"** button on the experience page.

### Editing and status
**Where:** `/experiences/[id]/edit`

Edits always create a **revision snapshot** before saving. You can see the last 10 revisions on any experience page. Status transitions:

- `DRAFT` → `SUBMITTED` (student action)
- `SUBMITTED` → `APPROVED` (teacher/admin)
- `SUBMITTED` → `NEEDS_REVISION` (teacher/admin, with a reason)
- Any → `ARCHIVED` (manual)

The **soft-delete** mechanism means deleted experiences live in the database for 30 days (configured to your schema) and can be restored. They never actually destroy your data.

### Evidence uploads
**Where:** On the experience form, in the **Evidence** section

Drag-and-drop or click to add files. Up to **50 MB per file**, allowed types:

- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM
- Documents: PDF

Each file is stored under `uploads/{your-user-id}/{experience-id}/` and served only to authenticated users. The `(auth)` route at `/api/files/...` enforces both authentication and **path-owner checks** — a request like `/api/files/<somebody-else>/...` is rejected with HTTP 403.

You can also attach links (`https://...`) without uploading anything.

### Comments
**Where:** At the bottom of any experience page (visible to teachers/admins at minimum)

Threaded comments. The experience owner gets an in-app notification whenever a teacher comments.

### Notifications
**Where:** 🔔 in the header

In-app dots for unread notifications. Triggers:

- Teacher approves your experience
- Teacher requests revision (with their reason)
- Teacher or admin comments on your work

There's no email digest or push notification — the bell icon is the only channel.

### Portfolio export
**Where:** `/portfolio`

A printable summary view. Designed to look clean in `Cmd/Ctrl+P` → "Save as PDF." Includes:

- Cover with your name and generation date
- Summary: total experiences, learning outcomes achieved (X/7), strand distribution
- All your **submitted or approved** experiences with full text and evidence filenames

### Settings
**Where:** `/settings`

Tabs for **Profile**, **Appearance** (theme), **Connected Accounts** (OAuth providers), **Security** (sign-out everywhere), **Accessibility**, and **Preferences** (default landing page, default experience view).

---

## For teachers

**Role required:** `TEACHER` (or `ADMIN`)

You'll see a **Teacher Dashboard** in the sidebar at `/teacher`. It shows:

- Pending reviews (experiences in `SUBMITTED` state) across your assigned students
- Stats: pending / approved / revision counts
- List of your assigned students with their experience counts

### Review actions

On any submitted experience, teachers can:

- **Approve** → moves the experience to `APPROVED`, notifies the student
- **Request revision** → moves to `NEEDS_REVISION` with a required reason (max 2,000 chars), notifies the student
- **Comment** → visible to the student and other reviewers, threads supported

Teachers can only see experiences from students explicitly **assigned** to them via the admin's [assignment flow](Configuration#teacher-assignments). They're blocked from viewing anyone else's work — the service layer enforces this.

---

## For admins

**Role required:** `ADMIN`

### Admin Dashboard
**Where:** `/admin`

System stats: total users, experiences (not deleted), uploads, comments. Role and status breakdowns. Recent users list and a roster of teachers.

### User management
**Where:** `/admin/users`

Paginated list with search and role filter. Promote/demote users between `STUDENT`/`TEACHER`/`ADMIN`. **You can't demote yourself** — the action guards against it. Every role change is recorded in the audit log.

### Teacher ↔ student assignments
**Where:** `/admin/assignments`

Pick a teacher, then select the students they supervise. Assignments replace the previous list for that teacher (it's not additive — easy to reason about). Only admins see this screen.

### Audit log
**Where:** `/admin/audit`

A time-sorted list of every recorded system action. Filterable by action, user, entity, and date range. Entries are written by background-fail-safe triggers — log writes never block the user-facing action. Covered actions include sign-ins, experience lifecycle, role changes, teacher assignments, and config changes.

### System stats API
Available to admins via the server action `getSystemStats()` — also displayed on the dashboard.

---

## What's deliberately out of scope (for now)

Real-time notifications, S3-backed uploads, and AI assistance are in [the roadmap](What-Is-CASAtlas) but not yet shipped. There's also no mobile app — the web UI is fully responsive and works in mobile browsers.
