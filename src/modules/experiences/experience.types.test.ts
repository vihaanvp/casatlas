import { describe, it, expect } from "vitest"
import {
  experienceBaseSchema,
  experienceDraftSchema,
  experienceSearchSchema,
  evidenceInputSchema,
  linkEvidenceSchema,
} from "./experience.types"

describe("experienceBaseSchema", () => {
  const validExperience = {
    title: "Beach Cleanup",
    date: "2026-07-10",
  }

  it("accepts minimal valid data", () => {
    const result = experienceBaseSchema.safeParse(validExperience)
    expect(result.success).toBe(true)
  })

  it("accepts all optional fields", () => {
    const result = experienceBaseSchema.safeParse({
      ...validExperience,
      description: "A great experience",
      reflection: "I learned a lot",
      supervisor: "Ms. Johnson",
      hours: 4.5,
      location: "City Beach",
      notes: "Fun day",
      isGroup: true,
      strands: ["CREATIVITY", "SERVICE"],
      outcomes: ["Identify own strengths and develop areas for growth"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = experienceBaseSchema.safeParse({
      title: "",
      date: "2026-07-10",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined()
    }
  })

  it("rejects title over 200 chars", () => {
    const result = experienceBaseSchema.safeParse({
      title: "x".repeat(201),
      date: "2026-07-10",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty date", () => {
    const result = experienceBaseSchema.safeParse({
      title: "Test",
      date: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects description over 5000 chars", () => {
    const result = experienceBaseSchema.safeParse({
      title: "Test",
      date: "2026-07-10",
      description: "x".repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid strand values", () => {
    const result = experienceBaseSchema.safeParse({
      title: "Test",
      date: "2026-07-10",
      strands: ["INVALID"],
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid strand values", () => {
    const result = experienceBaseSchema.safeParse({
      title: "Test",
      date: "2026-07-10",
      strands: ["CREATIVITY", "ACTIVITY", "SERVICE"],
    })
    expect(result.success).toBe(true)
  })

  it("coerces hours to number", () => {
    const result = experienceBaseSchema.safeParse({
      title: "Test",
      date: "2026-07-10",
      hours: "4.5",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.hours).toBe(4.5)
    }
  })

  it("rejects negative hours", () => {
    const result = experienceBaseSchema.safeParse({
      title: "Test",
      date: "2026-07-10",
      hours: -1,
    })
    expect(result.success).toBe(false)
  })

  it("defaults isGroup to false", () => {
    const result = experienceBaseSchema.safeParse(validExperience)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isGroup).toBe(false)
    }
  })

  it("defaults strands and outcomes to empty arrays", () => {
    const result = experienceBaseSchema.safeParse(validExperience)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.strands).toEqual([])
      expect(result.data.outcomes).toEqual([])
    }
  })
})

describe("experienceDraftSchema", () => {
  it("accepts empty data (all optional)", () => {
    const result = experienceDraftSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts partial data", () => {
    const result = experienceDraftSchema.safeParse({
      title: "Draft title",
    })
    expect(result.success).toBe(true)
  })

  it("accepts full data", () => {
    const result = experienceDraftSchema.safeParse({
      id: "abc123",
      title: "Draft",
      date: "2026-07-10",
      strands: ["ACTIVITY"],
    })
    expect(result.success).toBe(true)
  })
})

describe("experienceSearchSchema", () => {
  it("accepts empty params", () => {
    const result = experienceSearchSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sortBy).toBe("date")
      expect(result.data.sortOrder).toBe("desc")
    }
  })

  it("accepts valid status filter", () => {
    const result = experienceSearchSchema.safeParse({ status: "DRAFT" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = experienceSearchSchema.safeParse({ status: "INVALID" })
    expect(result.success).toBe(false)
  })

  it("accepts valid sort options", () => {
    const result = experienceSearchSchema.safeParse({
      sortBy: "title",
      sortOrder: "asc",
    })
    expect(result.success).toBe(true)
  })
})

describe("evidenceInputSchema", () => {
  it("accepts valid evidence", () => {
    const result = evidenceInputSchema.safeParse({
      experienceId: "abc123",
      type: "IMAGE",
      url: "https://example.com/photo.jpg",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024,
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing experienceId", () => {
    const result = evidenceInputSchema.safeParse({
      type: "IMAGE",
      url: "https://example.com/photo.jpg",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid type", () => {
    const result = evidenceInputSchema.safeParse({
      experienceId: "abc123",
      type: "DOCUMENT",
      url: "https://example.com/file.pdf",
      filename: "file.pdf",
      mimeType: "application/pdf",
      size: 1024,
    })
    expect(result.success).toBe(false)
  })
})

describe("linkEvidenceSchema", () => {
  it("accepts valid link", () => {
    const result = linkEvidenceSchema.safeParse({
      experienceId: "abc123",
      url: "https://example.com",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.filename).toBe("Link")
    }
  })

  it("rejects invalid URL", () => {
    const result = linkEvidenceSchema.safeParse({
      experienceId: "abc123",
      url: "not-a-url",
    })
    expect(result.success).toBe(false)
  })
})
