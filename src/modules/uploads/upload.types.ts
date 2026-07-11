import { z } from "zod"

export const uploadEvidenceSchema = z.object({
  experienceId: z.string().min(1),
})

export type UploadEvidenceInput = z.infer<typeof uploadEvidenceSchema>
