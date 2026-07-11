import { z } from "zod"

// ─── Experience Validation ────────────────────────────────

export const experienceInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  date: z.string().min(1, "Date is required"),
  description: z.string().max(5000).optional(),
  reflection: z.string().max(50000).optional(),
  supervisor: z.string().max(200).optional(),
  hours: z.number().min(0).max(1000).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  isGroup: z.boolean().default(false),
  outcomes: z.array(z.string()).optional(),
  strands: z.array(z.enum(["CREATIVITY", "ACTIVITY", "SERVICE"])).optional(),
})

export type ExperienceInput = z.infer<typeof experienceInputSchema>

// ─── Settings Validation ──────────────────────────────────

export const profileInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
})

export const appearanceInputSchema = z.object({
  theme: z.enum(["dark", "light"]),
})

// ─── Upload Validation ────────────────────────────────────

export const uploadInputSchema = z.object({
  experienceId: z.string().min(1),
})
