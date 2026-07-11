# What Is CASAtlas?

CASAtlas is a **self-hosted web app** for students in the **IB Diploma Programme** to record, organise, and reflect on their CAS (Creativity, Activity, Service) experiences.

You can use it just for yourself, share it with your class so teachers can give feedback and approvals, or run an entire school instance where admins manage roles.

---

## What's CAS?

If you're new to the IB, here's a quick refresher:

| Term | What it means |
|------|---------------|
| **CAS** | One of the three core requirements of the IB Diploma. Students must complete a balanced programme of **Creativity** (arts, creative thinking), **Activity** (sports, physical exertion), and **Service** (unpaid volunteer work for the community). |
| **Experience** | A single completed activity. A school play (Creativity), a half marathon (Activity), a beach cleanup (Service), a robotics club — each one is an experience. |
| **Strands** | The three categories above. Each experience belongs to one or more strands. |
| **Learning outcomes** | Seven IB-defined outcomes that CAS is meant to develop. Every experience should connect to one or more of these. You can find them in the app's [`LEARNING_OUTCOMES` table](https://github.com/vihaanvp/casatlas/blob/main/src/lib/constants.ts). |
| **Reflection** | A short written piece on what the student learned, how they grew, and what they'd do differently. The IB requires reflections to be written for every experience. |

CASAtlas stores all of this and produces a printable PDF summary at the end.

---

## Who is CASAtlas for?

CASAtlas is a good fit if you want to:

- **Track your own CAS journey** without depending on a third-party cloud service.
- **Run CAS for your school or class** with proper role separation between students, supervising teachers, and admins.
- **Preserve your own data** in your own database — exportable, restorable, yours to keep.
- **Avoid subscription costs** for an IB portfolio product. CASAtlas is free and MIT-licensed.

If you're a student without technical support available, you can still self-host on a small VPS or even a Raspberry Pi — see [Self-Hosting with Docker](Self-Hosting-with-Docker).

---

## What CASAtlas is *not*

It's worth being clear about the boundaries:

- **Not an IB-official product.** It's an independent tool. Your IB coordinator still uses ManageBac or similar to grade CAS.
- **Not a substitute for teacher feedback.** Teachers can leave comments here, but the IB assessor never sees this. It's a working portfolio, not a final submission system.
- **Not a multi-tenant SaaS.** Each instance is one deployment. If you want to give someone "an account on your CASAtlas," they sign into that specific instance with the OAuth provider you've configured.

---

## Roadmap at a glance

The big features that are planned after v0.1.x:

- Cloud storage (S3-compatible) for evidence uploads
- Bulk teacher review actions
- AI-assisted reflection prompts
- A truly "stable" v1.0.0 release

Everything in [Features](Features) already works.

Continue with [Features](Features) to see what CASAtlas does for you, or jump straight to [Self-Hosting Overview](Self-Hosting-Overview) if you've already decided to install it.
