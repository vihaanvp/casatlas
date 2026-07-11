import { z } from "zod"

// ─── Experience Schemas ───────────────────────────────────

export const experienceBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  date: z.string().min(1, "Date is required"),
  description: z.string().max(5000, "Description must be under 5,000 characters").optional(),
  reflection: z.string().max(50000, "Reflection must be under 50,000 characters").optional(),
  supervisor: z.string().max(200, "Supervisor must be under 200 characters").optional(),
  hours: z.coerce.number().min(0, "Hours must be positive").max(1000, "Hours must be under 1,000").optional(),
  location: z.string().max(200, "Location must be under 200 characters").optional(),
  notes: z.string().max(5000, "Notes must be under 5,000 characters").optional(),
  isGroup: z.boolean().default(false),
  strands: z.array(z.enum(["CREATIVITY", "ACTIVITY", "SERVICE"])).default([]),
  outcomes: z.array(z.string()).default([]),
})

export const experienceCreateSchema = experienceBaseSchema

export const experienceUpdateSchema = experienceBaseSchema.extend({
  id: z.string().min(1),
})

export const experienceDraftSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(200).optional(),
  date: z.string().optional(),
  description: z.string().max(5000).optional(),
  reflection: z.string().max(50000).optional(),
  supervisor: z.string().max(200).optional(),
  hours: z.coerce.number().min(0).max(1000).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  isGroup: z.boolean().optional(),
  strands: z.array(z.enum(["CREATIVITY", "ACTIVITY", "SERVICE"])).optional(),
  outcomes: z.array(z.string()).optional(),
})

export const experienceSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "NEEDS_REVISION", "ARCHIVED"]).optional(),
  strand: z.enum(["CREATIVITY", "ACTIVITY", "SERVICE"]).optional(),
  outcome: z.string().optional(),
  sortBy: z.enum(["date", "title", "createdAt", "updatedAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// ─── Evidence Schemas ─────────────────────────────────────

export const evidenceInputSchema = z.object({
  experienceId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO", "PDF", "LINK"]),
  url: z.string().url().optional(),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(0),
})

export const linkEvidenceSchema = z.object({
  experienceId: z.string().min(1),
  url: z.string().url("Please enter a valid URL"),
  filename: z.string().default("Link"),
})

// ─── Types ────────────────────────────────────────────────

export type ExperienceBaseInput = z.infer<typeof experienceBaseSchema>
export type ExperienceCreateInput = z.infer<typeof experienceCreateSchema>
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>
export type ExperienceDraftInput = z.infer<typeof experienceDraftSchema>
export type ExperienceSearchParams = z.infer<typeof experienceSearchSchema>
export type EvidenceInput = z.infer<typeof evidenceInputSchema>
export type LinkEvidenceInput = z.infer<typeof linkEvidenceSchema>

// ─── Action Results ───────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
