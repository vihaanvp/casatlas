# Adding an Experience Field

This page walks through adding a single field end-to-end so you can use it as a template. **Example: add an optional `impact_score` (integer 0–10) to experiences.**

The five things you'll touch:

1. `prisma/schema.prisma` — the data model
2. A migration — generated, then committed
3. `src/modules/experiences/experience.types.ts` — the Zod schema
4. `src/modules/experiences/experience.service.ts` — the data layer
5. `src/modules/experiences/components/experience-form.tsx` — the UI

Plus tests in `src/modules/experiences/experience.types.test.ts`.

---

## 1. Schema

In `prisma/schema.prisma`, find the `Experience` model and add:

```prisma
model Experience {
  // ... existing fields ...
  impactScore Int?    // 0..10, optional
  // ...
  @@map("experiences")
}
```

Why `Int?` (optional)? If you made it required with a `@default(0)`, every existing row would silently get `0` as a value, which the IB might surprise-misinterpret as "no impact." Optional is the safer default for a fresh new field.

---

## 2. Migration

```bash
pnpm prisma migrate dev --name experience_impact_score
```

Output:

```
✔ Generated Prisma Client (v...)
Your database is now in sync with your schema.

✔ Created migration at prisma/migrations/20260711120000_experience_impact_score/

The following migration(s) have been created:
  prisma/migrations/20260711120000_experience_impact_score/migration.sql
```

Open the generated SQL — make sure it's sane:

```sql
-- AlterTable
ALTER TABLE "experiences" ADD COLUMN "impactScore" INTEGER;
```

(For production deployments, prefer editing this by hand first if it's a destructive change. For an additive nullable column, the auto-generated SQL is fine.)

---

## 3. Zod schema

In `src/modules/experiences/experience.types.ts`:

```ts
export const experienceBaseSchema = z.object({
  // ... existing fields ...
  impactScore: z.coerce.number().int("Must be a whole number")
    .min(0, "Impact score cannot be negative")
    .max(10, "Impact score must be 0–10")
    .optional(),
  // ...
})
```

Why `z.coerce.number()`? HTML forms send strings; coerce makes the value behave numerically before constraints apply.

Add a test in `experience.types.test.ts`:

```ts
it("accepts impactScore in range", () => {
  const result = experienceBaseSchema.safeParse({
    title: "Test", date: "2026-07-10", impactScore: 7,
  })
  expect(result.success).toBe(true)
})

it("rejects impactScore over 10", () => {
  const result = experienceBaseSchema.safeParse({
    title: "Test", date: "2026-07-10", impactScore: 11,
  })
  expect(result.success).toBe(false)
})
```

Run the tests:

```bash
pnpm test src/modules/experiences/experience.types.test.ts
```

---

## 4. Service layer

Open `src/modules/experiences/experience.service.ts`. Both `createExperience` and `updateExperience` need to accept and persist the field.

```ts
// In createExperience's argument type:
export async function createExperience(
  userId: string,
  data: {
    title: string
    date: Date
    description?: string
    reflection?: string
    supervisor?: string
    hours?: number
    location?: string
    notes?: string
    isGroup?: boolean
    strands?: string[]
    outcomes?: string[]
    impactScore?: number      // <-- new
  }
) {
  return prisma.experience.create({
    data: {
      userId,
      title: data.title,
      date: data.date,
      description: data.description,
      reflection: data.reflection,
      supervisor: data.supervisor,
      hours: data.hours,
      location: data.location,
      notes: data.notes,
      isGroup: data.isGroup ?? false,
      impactScore: data.impactScore,    // <-- new
      strands: data.strands?.length ? { create: ... } : undefined,
      outcomes: data.outcomes?.length ? { create: ... } : undefined,
    },
    include: { outcomes: true, strands: true },
  })
}
```

Repeat the same change in `updateExperience`. The action layer will hand the validated value through, and Prisma will write it. The action layer does not need changes — it's already passing every property through.

> **Don't forget `ExperienceRevision`.** The `updateExperience` function snapshots the row before updating. If `impactScore` should be part of the history, add it to the snapshot object:
> ```ts
> snapshot: {
>   // existing fields...
>   impactScore: existing.impactScore,
> }
> ```

---

## 5. UI

Open `src/modules/experiences/components/experience-form.tsx`. You'll find the form has all existing fields wired up. Add a new field with the matching label.

```tsx
<div className="space-y-2">
  <Label htmlFor="impactScore">Self-assessed impact (0–10)</Label>
  <Input
    id="impactScore"
    name="impactScore"
    type="number"
    min={0}
    max={10}
    defaultValue={experience?.impactScore ?? ""}
    placeholder="Optional"
  />
</div>
```

Most form components in this codebase use **uncontrolled** `<Input>` elements, then read values from `FormData` on submit. So you usually don't need to thread the new field through component state — just add the input.

If you're using a controlled field elsewhere (e.g. scoreboard-style interactions), update the component state and the Zod schema-fan-out site.

---

## 6. Verify

```bash
pnpm lint
pnpm type-check
pnpm test
```

Make sure CI passes locally before pushing. The migration will be applied automatically on container boot.

---

## Audit / notifications — should they touch this field?

For most fields: no.

- **`AuditLog`**: doesn't carry arbitrary field changes. The action log just records "EXPERIENCE_UPDATED" without diffs.
- **`Notification`**: link field is for navigation, not data. Skip.
- **`portfolio/page.tsx`**: if you want the new field to appear in the print export, add it to the portfolio page query + render.

If the field changes teacher workflows (e.g. "low impact_scores require teacher attention"), you'd touch the teacher dashboard and `notifications.ts`. For most fields, you don't.

---

## Schema-level considerations you don't need to think about often, but should

- **Indexes.** If you'll filter by `impactScore` (e.g. to find experiences with impact ≥ 8), add `@@index([userId, impactScore])` and a migration to backfill.
- **Cascade delete.** Adding a new related model? Use `onDelete: Cascade` only if rows truly have no meaning without the parent.
- **Soft delete.** New joins should still respect `deletedAt IS NULL`. Reference how `experience.service.ts` filters by `deletedAt` and copy the pattern.

---

## Where to go next

- **Why is the field shape the way it is?** → [Database Schema](Database-Schema)
- **Where does this fit in the bigger picture?** → [Architecture](Architecture)
- **Run tests** → [Testing](Testing)
