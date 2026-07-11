// ─── CAS Learning Outcomes ────────────────────────────────

export const LEARNING_OUTCOMES = [
  "Identify own strengths and develop areas for growth",
  "Demonstrate that challenges have been undertaken, developing new skills in the process",
  "Demonstrate how to initiate and plan a CAS experience",
  "Show commitment to and perseverance in CAS experiences",
  "Demonstrate the skills and benefits of working collaboratively",
  "Demonstrate engagement with issues of global significance",
  "Recognize and consider the ethics of choices and actions",
] as const

export type LearningOutcome = (typeof LEARNING_OUTCOMES)[number]

// ─── CAS Strands ──────────────────────────────────────────

export const CAS_STRANDS = ["CREATIVITY", "ACTIVITY", "SERVICE"] as const

export type CASStrand = (typeof CAS_STRANDS)[number]

export const CAS_STRAND_LABELS: Record<CASStrand, string> = {
  CREATIVITY: "Creativity",
  ACTIVITY: "Activity",
  SERVICE: "Service",
}

// ─── Experience Statuses ──────────────────────────────────

export const EXPERIENCE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "NEEDS_REVISION",
  "ARCHIVED",
] as const

export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number]

export const EXPERIENCE_STATUS_LABELS: Record<ExperienceStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  NEEDS_REVISION: "Needs Revision",
  ARCHIVED: "Archived",
}

export const EXPERIENCE_STATUS_COLORS: Record<ExperienceStatus, string> = {
  DRAFT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  NEEDS_REVISION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ARCHIVED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

// ─── Evidence Types ───────────────────────────────────────

export const EVIDENCE_TYPES = ["IMAGE", "VIDEO", "PDF", "LINK"] as const

export type EvidenceType = (typeof EVIDENCE_TYPES)[number]

// ─── App Constants ────────────────────────────────────────

export const APP_NAME = "CASAtlas"
export const APP_DESCRIPTION = "Document and manage your IB CAS journey"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm"],
  document: ["application/pdf"],
} as const

export const THUMBNAIL_CONFIG = {
  width: 300,
  height: 300,
  format: "webp" as const,
}
