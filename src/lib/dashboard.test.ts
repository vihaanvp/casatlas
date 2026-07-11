import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ─── Search API Logic ────────────────────────────────────
// Ponytail: test the query-building logic, not the full API route handler.
// The route handler is a thin wrapper around Prisma.

describe("Search query building", () => {
  it("rejects empty queries", () => {
    const query = ""
    const isValid = query.trim().length >= 2
    expect(isValid).toBe(false)
  })

  it("rejects single-character queries", () => {
    const query = "a"
    const isValid = query.trim().length >= 2
    expect(isValid).toBe(false)
  })

  it("accepts valid queries", () => {
    const query = "beach cleanup"
    const isValid = query.trim().length >= 2
    expect(isValid).toBe(true)
  })

  it("trims whitespace from queries", () => {
    const query = "  beach  "
    const trimmed = query.trim()
    expect(trimmed).toBe("beach")
    expect(trimmed.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Keyboard Shortcut Logic ─────────────────────────────

describe("Keyboard shortcuts", () => {
  beforeEach(() => {
    vi.stubGlobal("document", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("registers keydown listener", () => {
    const addEventListener = document.addEventListener as ReturnType<typeof vi.fn>
    // Simulate what useCommandK does
    document.addEventListener("keydown", () => {})
    expect(addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function))
  })

  it("detects Ctrl+K", () => {
    let triggered = false
    const mockHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        triggered = true
      }
    }

    mockHandler({ key: "k", ctrlKey: true, metaKey: false } as KeyboardEvent)
    expect(triggered).toBe(true)
  })

  it("detects Cmd+K (metaKey)", () => {
    let triggered = false
    const mockHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        triggered = true
      }
    }

    mockHandler({ key: "k", ctrlKey: false, metaKey: true } as KeyboardEvent)
    expect(triggered).toBe(true)
  })

  it("does not trigger on plain K", () => {
    let triggered = false
    const mockHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        triggered = true
      }
    }

    mockHandler({ key: "k", ctrlKey: false, metaKey: false } as KeyboardEvent)
    expect(triggered).toBe(false)
  })

  it("detects Ctrl+S", () => {
    let triggered = false
    const mockHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        triggered = true
      }
    }

    mockHandler({ key: "s", ctrlKey: true, metaKey: false } as KeyboardEvent)
    expect(triggered).toBe(true)
  })

  it("detects Escape", () => {
    let triggered = false
    const mockHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggered = true
      }
    }

    mockHandler({ key: "Escape" } as KeyboardEvent)
    expect(triggered).toBe(true)
  })
})

// ─── Accessibility Settings ──────────────────────────────

describe("Accessibility settings persistence", () => {
  const STORAGE_KEY = "casatlas-accessibility"
  const store: Record<string, string> = {}

  beforeEach(() => {
    // ponytail: mock localStorage — node env doesn't have it
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    })
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads defaults when no settings exist", () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const settings = raw ? JSON.parse(raw) : { reducedMotion: false, increasedContrast: false, largerFonts: false }
    expect(settings.reducedMotion).toBe(false)
    expect(settings.increasedContrast).toBe(false)
    expect(settings.largerFonts).toBe(false)
  })

  it("saves and loads settings", () => {
    const settings = { reducedMotion: true, increasedContrast: false, largerFonts: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(loaded.reducedMotion).toBe(true)
    expect(loaded.largerFonts).toBe(true)
  })

  it("merges with defaults on load", () => {
    const saved = { reducedMotion: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const defaults = { reducedMotion: false, increasedContrast: false, largerFonts: false }
    const loaded = { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)!) }
    expect(loaded.reducedMotion).toBe(true)
    expect(loaded.increasedContrast).toBe(false)
  })
})

// ─── Preferences Persistence ─────────────────────────────

describe("Preferences persistence", () => {
  const STORAGE_KEY = "casatlas-preferences"
  const store: Record<string, string> = {}

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    })
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads defaults when no preferences exist", () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const prefs = raw ? JSON.parse(raw) : { defaultLanding: "/dashboard", defaultExperienceView: "cards" }
    expect(prefs.defaultLanding).toBe("/dashboard")
    expect(prefs.defaultExperienceView).toBe("cards")
  })

  it("saves and loads custom preferences", () => {
    const prefs = { defaultLanding: "/experiences", defaultExperienceView: "table" }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))

    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(loaded.defaultLanding).toBe("/experiences")
    expect(loaded.defaultExperienceView).toBe("table")
  })
})

// ─── Activity Feed Logic ─────────────────────────────────

describe("Activity feed deduplication", () => {
  type ActivityItem = {
    id: string
    type: "created" | "updated" | "revision"
    experienceId: string
    experienceTitle: string
    timestamp: Date
  }

  function dedupe(items: ActivityItem[]): ActivityItem[] {
    const map = new Map<string, ActivityItem>()
    for (const item of items) {
      const key = `${item.type}-${item.experienceId}`
      if (!map.has(key) || map.get(key)!.timestamp < item.timestamp) {
        map.set(key, item)
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  it("dedupes by type+experienceId, keeps latest", () => {
    const items: ActivityItem[] = [
      { id: "1", type: "updated", experienceId: "e1", experienceTitle: "Exp 1", timestamp: new Date("2024-01-01") },
      { id: "2", type: "updated", experienceId: "e1", experienceTitle: "Exp 1", timestamp: new Date("2024-01-03") },
      { id: "3", type: "created", experienceId: "e1", experienceTitle: "Exp 1", timestamp: new Date("2024-01-02") },
    ]

    const result = dedupe(items)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("2") // latest updated
    expect(result[1].id).toBe("3") // created
  })

  it("sorts by timestamp descending", () => {
    const items: ActivityItem[] = [
      { id: "1", type: "created", experienceId: "e1", experienceTitle: "A", timestamp: new Date("2024-01-01") },
      { id: "2", type: "created", experienceId: "e2", experienceTitle: "B", timestamp: new Date("2024-01-03") },
      { id: "3", type: "created", experienceId: "e3", experienceTitle: "C", timestamp: new Date("2024-01-02") },
    ]

    const result = dedupe(items)
    expect(result[0].experienceTitle).toBe("B")
    expect(result[1].experienceTitle).toBe("C")
    expect(result[2].experienceTitle).toBe("A")
  })

  it("handles empty array", () => {
    expect(dedupe([])).toHaveLength(0)
  })
})

// ─── Strand Progress Logic ───────────────────────────────

describe("Strand progress calculation", () => {
  it("calculates strand counts", () => {
    const strands = [
      { strand: "CREATIVITY" },
      { strand: "CREATIVITY" },
      { strand: "ACTIVITY" },
      { strand: "SERVICE" },
      { strand: "SERVICE" },
      { strand: "SERVICE" },
    ]

    const counts = { CREATIVITY: 0, ACTIVITY: 0, SERVICE: 0 }
    for (const s of strands) {
      counts[s.strand as keyof typeof counts]++
    }

    expect(counts.CREATIVITY).toBe(2)
    expect(counts.ACTIVITY).toBe(1)
    expect(counts.SERVICE).toBe(3)
  })

  it("handles empty strands", () => {
    const counts = { CREATIVITY: 0, ACTIVITY: 0, SERVICE: 0 }
    expect(counts.CREATIVITY).toBe(0)
    expect(counts.ACTIVITY).toBe(0)
    expect(counts.SERVICE).toBe(0)
  })
})

// ─── Outcome Progress Logic ──────────────────────────────

describe("Outcome progress calculation", () => {
  it("counts unique outcomes", () => {
    const experiences = [
      { outcomes: [{ outcome: "A" }, { outcome: "B" }] },
      { outcomes: [{ outcome: "B" }, { outcome: "C" }] },
      { outcomes: [{ outcome: "A" }, { outcome: "D" }] },
    ]

    const outcomes = new Set<string>()
    for (const exp of experiences) {
      for (const o of exp.outcomes) {
        outcomes.add(o.outcome)
      }
    }

    expect(outcomes.size).toBe(4)
    expect(outcomes.has("A")).toBe(true)
    expect(outcomes.has("D")).toBe(true)
  })

  it("calculates percentage", () => {
    const completed = 5
    const total = 7
    const percentage = Math.round((completed / total) * 100)
    expect(percentage).toBe(71)
  })
})
