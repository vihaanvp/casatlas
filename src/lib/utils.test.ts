import { describe, it, expect } from "vitest"
import { cn, formatDate, formatFileSize, formatDuration, slugify, getInitials } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar")).toBe("foo")
  })

  it("deduplicates tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })
})

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15")
    expect(result).toContain("January")
    expect(result).toContain("15")
    expect(result).toContain("2024")
  })

  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-06-20"))
    expect(result).toContain("June")
    expect(result).toContain("20")
  })
})

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B")
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(1048576)).toBe("1 MB")
  })
})

describe("formatDuration", () => {
  it("formats hours", () => {
    expect(formatDuration(1)).toBe("1h")
    expect(formatDuration(2.5)).toBe("2h 30m")
  })

  it("formats minutes", () => {
    expect(formatDuration(0.5)).toBe("30min")
  })
})

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world")
    expect(slugify("My CAS Experience")).toBe("my-cas-experience")
  })
})

describe("getInitials", () => {
  it("gets initials from name", () => {
    expect(getInitials("John Doe")).toBe("JD")
    expect(getInitials("Alice")).toBe("A")
    expect(getInitials("Bob Smith Jones")).toBe("BS")
  })
})
