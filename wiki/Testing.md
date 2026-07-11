# Testing

CASAtlas uses **Vitest** as the only test runner. We don't have Playwright (the `test:e2e` package.json script is declared but no tests are written yet), and we don't write integration tests against a live database.

---

## What we test

| File | Coverage |
|------|----------|
| `src/modules/experiences/experience.types.test.ts` | Every Zod schema in `experience.types.ts` — accept-valid, reject-invalid, default values, coercion, field-level errors |
| `src/lib/utils.test.ts` | Date / duration / size formatting, `cn()` Tailwind merge, `slugify()` |
| `src/lib/constants.test.ts` | Strands, statuses, learning outcomes — label maps and enums stay consistent |
| `src/lib/rbac.test.ts` | Role-to-permission mappings |
| `src/lib/navigation.test.ts` | Active-route detection logic |
| `src/lib/dashboard.test.ts` | Cmd+K keyboard shortcuts, accessibility settings persistence, preference persistence, activity-feed deduplication, strand/outcome progress calculation |

Current totals: **89 tests, all passing** (`pnpm test`).

---

## Conventions

- **Co-locate tests with code.** Tests live next to source files: `path/to/thing.ts` → `path/to/thing.test.ts`. Vitest picks them up via the `include: ["src/**/*.test.{ts,tsx}"]` rule in `vitest.config.ts`.
- **Test the formula, not the framework.** Tests import the pure logic and exercise it. We don't mock Prisma; we don't mock Next.js. The things written here (Zod schemas, RBAC, activity dedupe) are the kinds of code where unit tests are valuable.
- **Prefer `safeParse`-style assertions.** For Zod tests, check `result.success` and `result.error.flatten().fieldErrors[field]` — the same shape the action layer handles.
- **Polish naming dots.** Tests are grouped by what they're testing, not by which file:
  ```ts
  describe("experienceDraftSchema", () => { ... })
  describe("Strand progress calculation", () => { ... })
  describe("Keyboard shortcuts", () => { ... })
  ```

---

## Things we explicitly don't test (and why)

**No DB-integrated tests.** Vitest runs in `environment: "node"` (see `vitest.config.ts`). The Prisma client would try to connect to a real database that doesn't exist in CI's `test:` job. Adding DB tests would mean either:
- Adding a Postgres service to the test job (slower CI, more moving parts)
- Using a separate in-process SQLite/Prisma adapter (discrepancy risk)
- Stubbing Prisma (we'd be testing mocks)

For v0.1.x we value **fast, deterministic tests** over coverage numbers. Prisma queries are tested manually via the end-to-end app and via curl in dev. Add DB tests when you find an actual bug class that escapes — until then they're noise.

**No component tests with `@testing-library/react`.** The dep is installed but we haven't written any tests against components. Component tests of Server Components need extra plumbing. If you want to add one, look at `tests/setup.ts` first — it's currently a single line that loads `@testing-library/jest-dom`.

**No Playwright e2e tests.** The `pnpm test:e2e` script is declared but no `playwright.config.ts` exists. Adding e2e tests is high-value but a real investment; keep that scoped for a future release.

---

## How to run

```bash
# Run once, exit at the end
pnpm test

# Watch mode
pnpm test:watch

# Single file
pnpm test src/lib/rbac.test.ts

# Single describe block (by name)
pnpm test -t "Keyboard shortcuts"
```

CI runs `pnpm test` once (no watch mode) as the `Test` job.

---

## How to write a new test

```ts
import { describe, it, expect } from "vitest"
import { myUtil } from "./my-util"

describe("myUtil", () => {
  it("does the obvious thing", () => {
    expect(myUtil("input")).toBe("expected output")
  })

  it("handles edge case", () => {
    expect(myUtil("")).toBe("")
  })
})
```

Save it as `src/lib/my-util.test.ts` next to the source. `pnpm test:watch` will pick it up.

For Zod schemas specifically, follow the patterns in `experience.types.test.ts`:

```ts
it("rejects bad input", () => {
  const result = mySchema.safeParse(/* bad data */)
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.fieldName).toBeDefined()
  }
})

it("accepts good input", () => {
  const result = mySchema.safeParse(/* good data */)
  expect(result.success).toBe(true)
})
```

---

## CI gating

The `Test` job runs `pnpm test` and gates merges. If a test fails on `main`, fixing it is treated as a hot-fix.

The `Lint` job also runs `pnpm lint` and `pnpm type-check`. Both must pass before `Test` runs (they don't block independently, but they fail the overall commit).

If you're contributing, run all three locally before pushing:

```bash
pnpm lint && pnpm type-check && pnpm test
```

---

## Where to go next

- **Code structure** → [Developer Guide](Developer-Guide)
- **Architecture overview** → [Architecture](Architecture)
- **Examples of tests to mirror** → `src/modules/experiences/experience.types.test.ts`
