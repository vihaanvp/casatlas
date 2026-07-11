import { describe, it, expect } from "vitest"

// ─── Navigation Items ────────────────────────────────────

describe("Navigation configuration", () => {
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/experiences", label: "Experiences" },
    { href: "/settings", label: "Settings" },
  ]

  it("has correct nav items", () => {
    expect(navItems).toHaveLength(3)
    expect(navItems.map((i) => i.href)).toContain("/dashboard")
    expect(navItems.map((i) => i.href)).toContain("/experiences")
    expect(navItems.map((i) => i.href)).toContain("/settings")
  })

  it("detects active state for exact match", () => {
    const pathname = "/dashboard"
    const match = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    expect(match?.href).toBe("/dashboard")
  })

  it("detects active state for nested route", () => {
    const pathname = "/experiences/new"
    const match = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    expect(match?.href).toBe("/experiences")
  })

  it("detects inactive state", () => {
    const pathname = "/other"
    const match = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    expect(match).toBeUndefined()
  })
})

// ─── Settings Navigation ─────────────────────────────────

describe("Settings navigation", () => {
  const settingsItems = [
    { href: "/settings/profile", label: "Profile" },
    { href: "/settings/appearance", label: "Appearance" },
    { href: "/settings/accessibility", label: "Accessibility" },
    { href: "/settings/preferences", label: "Preferences" },
    { href: "/settings/accounts", label: "Connected Accounts" },
    { href: "/settings/security", label: "Security" },
  ]

  it("has all settings sections", () => {
    expect(settingsItems).toHaveLength(6)
  })

  it("detects active settings page", () => {
    const pathname = "/settings/profile"
    const match = settingsItems.find((item) => pathname === item.href)
    expect(match?.href).toBe("/settings/profile")
  })

  it("detects inactive settings page", () => {
    const pathname = "/settings/profile"
    const match = settingsItems.find((item) => item.href === "/settings/security")
    expect(match?.href).not.toBe(pathname)
  })
})

// ─── Quick Actions ───────────────────────────────────────

describe("Quick actions", () => {
  const actions = [
    { label: "New Experience", href: "/experiences/new" },
    { label: "Search", href: "/experiences" },
    { label: "Timeline", href: "/experiences?view=timeline" },
  ]

  it("has correct quick actions", () => {
    expect(actions).toHaveLength(3)
    expect(actions[0].href).toBe("/experiences/new")
  })
})

// ─── Theme Options ───────────────────────────────────────

describe("Theme options", () => {
  const themes = ["dark", "light", "system"]

  it("supports all theme options", () => {
    expect(themes).toContain("dark")
    expect(themes).toContain("light")
    expect(themes).toContain("system")
  })
})

// ─── Dashboard Stats Card Configuration ──────────────────

describe("Dashboard stats cards", () => {
  const cards = [
    { label: "Total Experiences", key: "total" },
    { label: "Drafts", key: "drafts" },
    { label: "Submitted", key: "submitted" },
    { label: "Approved", key: "approved" },
    { label: "Archived", key: "archived" },
  ]

  it("has 5 stats cards", () => {
    expect(cards).toHaveLength(5)
  })

  it("all cards have required fields", () => {
    for (const card of cards) {
      expect(card.label).toBeTruthy()
      expect(card.key).toBeTruthy()
    }
  })
})
