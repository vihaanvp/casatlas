import { describe, it, expect } from "vitest"
import {
  LEARNING_OUTCOMES,
  CAS_STRANDS,
  CAS_STRAND_LABELS,
  EXPERIENCE_STATUSES,
  EXPERIENCE_STATUS_LABELS,
  EXPERIENCE_STATUS_COLORS,
  EVIDENCE_TYPES,
} from "./constants"

describe("LEARNING_OUTCOMES", () => {
  it("has exactly 7 official IB CAS learning outcomes", () => {
    expect(LEARNING_OUTCOMES).toHaveLength(7)
  })

  it("contains all required outcomes", () => {
    expect(LEARNING_OUTCOMES).toContain("Identify own strengths and develop areas for growth")
    expect(LEARNING_OUTCOMES).toContain("Demonstrate that challenges have been undertaken, developing new skills in the process")
    expect(LEARNING_OUTCOMES).toContain("Demonstrate how to initiate and plan a CAS experience")
    expect(LEARNING_OUTCOMES).toContain("Show commitment to and perseverance in CAS experiences")
    expect(LEARNING_OUTCOMES).toContain("Demonstrate the skills and benefits of working collaboratively")
    expect(LEARNING_OUTCOMES).toContain("Demonstrate engagement with issues of global significance")
    expect(LEARNING_OUTCOMES).toContain("Recognize and consider the ethics of choices and actions")
  })
})

describe("CAS_STRANDS", () => {
  it("has exactly 3 strands", () => {
    expect(CAS_STRANDS).toHaveLength(3)
  })

  it("includes CREATIVITY, ACTIVITY, SERVICE", () => {
    expect(CAS_STRANDS).toContain("CREATIVITY")
    expect(CAS_STRANDS).toContain("ACTIVITY")
    expect(CAS_STRANDS).toContain("SERVICE")
  })
})

describe("CAS_STRAND_LABELS", () => {
  it("has a label for each strand", () => {
    for (const strand of CAS_STRANDS) {
      expect(CAS_STRAND_LABELS[strand]).toBeDefined()
      expect(typeof CAS_STRAND_LABELS[strand]).toBe("string")
    }
  })
})

describe("EXPERIENCE_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(EXPERIENCE_STATUSES).toHaveLength(5)
  })

  it("includes all workflow states", () => {
    expect(EXPERIENCE_STATUSES).toContain("DRAFT")
    expect(EXPERIENCE_STATUSES).toContain("SUBMITTED")
    expect(EXPERIENCE_STATUSES).toContain("APPROVED")
    expect(EXPERIENCE_STATUSES).toContain("NEEDS_REVISION")
    expect(EXPERIENCE_STATUSES).toContain("ARCHIVED")
  })
})

describe("EXPERIENCE_STATUS_LABELS", () => {
  it("has a human-readable label for each status", () => {
    expect(EXPERIENCE_STATUS_LABELS.DRAFT).toBe("Draft")
    expect(EXPERIENCE_STATUS_LABELS.SUBMITTED).toBe("Submitted")
    expect(EXPERIENCE_STATUS_LABELS.APPROVED).toBe("Approved")
    expect(EXPERIENCE_STATUS_LABELS.NEEDS_REVISION).toBe("Needs Revision")
    expect(EXPERIENCE_STATUS_LABELS.ARCHIVED).toBe("Archived")
  })
})

describe("EXPERIENCE_STATUS_COLORS", () => {
  it("has a color class for each status", () => {
    for (const status of EXPERIENCE_STATUSES) {
      expect(EXPERIENCE_STATUS_COLORS[status]).toBeDefined()
      expect(EXPERIENCE_STATUS_COLORS[status]).toContain("bg-")
      expect(EXPERIENCE_STATUS_COLORS[status]).toContain("text-")
    }
  })
})

describe("EVIDENCE_TYPES", () => {
  it("has exactly 4 types", () => {
    expect(EVIDENCE_TYPES).toHaveLength(4)
  })

  it("includes IMAGE, VIDEO, PDF, LINK", () => {
    expect(EVIDENCE_TYPES).toContain("IMAGE")
    expect(EVIDENCE_TYPES).toContain("VIDEO")
    expect(EVIDENCE_TYPES).toContain("PDF")
    expect(EVIDENCE_TYPES).toContain("LINK")
  })
})
