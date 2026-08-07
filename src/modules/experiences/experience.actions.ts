"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auditLog } from "@/lib/audit"
import { createNotification } from "@/lib/notifications"
import * as experienceService from "./experience.service"
import {
  experienceCreateSchema,
  experienceDraftSchema,
  experienceSearchSchema,
  type ExperienceCreateInput,
  type ExperienceDraftInput,
  type ExperienceSearchParams,
  type ActionResult,
} from "./experience.types"
import type { Experience } from "@prisma/client"
import { z } from "zod"

// ─── Create ───────────────────────────────────────────────

export async function createExperience(
  data: ExperienceCreateInput & { draftId?: string }
): Promise<ActionResult<Experience>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    const parsed = experienceCreateSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "root")
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      })
      return { success: false, error: "Validation failed", fieldErrors }
    }

    const experience = await experienceService.createExperience(
      session.user.id,
      {
        ...parsed.data,
        date: new Date(parsed.data.date),
      },
      data.draftId
    )

    auditLog({ userId: session.user.id, action: "EXPERIENCE_CREATED", entity: "Experience", entityId: experience.id })

    return { success: true, data: experience }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create experience"
    return { success: false, error: message }
  }
}

// ─── Update ───────────────────────────────────────────────

export async function updateExperience(
  id: string,
  data: ExperienceCreateInput
): Promise<ActionResult<Experience>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid experience ID" }
    }

    const parsed = experienceCreateSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "root")
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      })
      return { success: false, error: "Validation failed", fieldErrors }
    }

    const experience = await experienceService.updateExperience(id, session.user.id, {
      ...parsed.data,
      date: new Date(parsed.data.date),
    })

    return { success: true, data: experience }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update experience"
    return { success: false, error: message }
  }
}

// ─── Delete (Soft) ────────────────────────────────────────

export async function deleteExperience(
  id: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid experience ID" }
    }

    await experienceService.softDeleteExperience(id, session.user.id)

    auditLog({ userId: session.user.id, action: "EXPERIENCE_DELETED", entity: "Experience", entityId: id })

    revalidatePath("/experiences")
    revalidatePath("/dashboard")
    return { success: true, data: undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete experience"
    return { success: false, error: message }
  }
}

// ─── Restore ──────────────────────────────────────────────

export async function restoreExperience(
  id: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid experience ID" }
    }

    await experienceService.restoreExperience(id, session.user.id)

    revalidatePath("/experiences")
    revalidatePath("/dashboard")
    return { success: true, data: undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore experience"
    return { success: false, error: message }
  }
}

// ─── Submit ───────────────────────────────────────────────

export async function submitExperience(
  id: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid experience ID" }
    }

    // Only DRAFT and NEEDS_REVISION experiences can be (re)submitted.
    const existing = await prisma.experience.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
      select: { status: true, title: true },
    })
    if (!existing) return { success: false, error: "Experience not found" }
    if (!["DRAFT", "NEEDS_REVISION"].includes(existing.status)) {
      return { success: false, error: "Only drafts and experiences needing revision can be submitted" }
    }

    await experienceService.updateExperienceStatus(id, session.user.id, "SUBMITTED")

    auditLog({ userId: session.user.id, action: "EXPERIENCE_SUBMITTED", entity: "Experience", entityId: id })

    // Notify assigned teachers that a student submitted an experience.
    const assignments = await prisma.teacherStudent.findMany({
      where: { studentId: session.user.id },
      select: { teacherId: true },
    })
    for (const a of assignments) {
      await createNotification({
        userId: a.teacherId,
        type: "ANNOUNCEMENT",
        title: "Experience Submitted",
        message: `${session.user.name ?? "A student"} submitted "${existing.title}" for review.`,
        link: `/experiences/${id}`,
      })
    }

    revalidatePath("/experiences")
    revalidatePath(`/experiences/${id}`)
    revalidatePath("/dashboard")
    revalidatePath("/teacher")
    return { success: true, data: undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit experience"
    return { success: false, error: message }
  }
}

// ─── Draft Save (Autosave) ────────────────────────────────

export async function saveExperienceDraft(
  data: ExperienceDraftInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    const parsed = experienceDraftSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "root")
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      })
      return { success: false, error: "Validation failed", fieldErrors }
    }

    const userId = session.user.id
    const { id: draftId, ...draftData } = parsed.data

    if (draftId) {
      // Update existing draft
      const existing = await prisma.experience.findFirst({
        where: { id: draftId, userId, deletedAt: null },
      })
      if (!existing) {
        return { success: false, error: "Draft not found" }
      }

      // Empty strings clear the field (null); absent fields are left untouched.
      const orNull = (v: string | undefined) => (v === "" ? null : v)
      const updated = await prisma.experience.update({
        where: { id: draftId },
        data: {
          title: draftData.title || undefined,
          date: draftData.date ? new Date(draftData.date) : undefined,
          description: orNull(draftData.description),
          reflection: orNull(draftData.reflection),
          supervisor: orNull(draftData.supervisor),
          hours: draftData.hours,
          location: orNull(draftData.location),
          notes: orNull(draftData.notes),
          isGroup: draftData.isGroup,
          strands: draftData.strands !== undefined
            ? {
                deleteMany: {},
                create: draftData.strands.map((s) => ({ strand: s as "CREATIVITY" | "ACTIVITY" | "SERVICE" })),
              }
            : undefined,
          outcomes: draftData.outcomes !== undefined
            ? {
                deleteMany: {},
                create: draftData.outcomes.map((o) => ({ outcome: o })),
              }
            : undefined,
        },
      })

      revalidatePath("/experiences")
      return { success: true, data: { id: updated.id } }
    }

    // Create new draft
    const created = await prisma.experience.create({
      data: {
        userId,
        title: draftData.title || "Untitled Draft",
        date: draftData.date ? new Date(draftData.date) : new Date(),
        description: draftData.description,
        reflection: draftData.reflection,
        supervisor: draftData.supervisor,
        hours: draftData.hours,
        location: draftData.location,
        notes: draftData.notes,
        isGroup: draftData.isGroup ?? false,
        status: "DRAFT",
        strands: draftData.strands?.length
          ? { create: draftData.strands.map((s) => ({ strand: s as "CREATIVITY" | "ACTIVITY" | "SERVICE" })) }
          : undefined,
        outcomes: draftData.outcomes?.length
          ? { create: draftData.outcomes.map((o) => ({ outcome: o })) }
          : undefined,
      },
    })

    return { success: true, data: { id: created.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save draft"
    return { success: false, error: message }
  }
}

// ─── Fetch ────────────────────────────────────────────────

export async function getExperiences(
  params?: Partial<ExperienceSearchParams>
) {
  const session = await auth()
  if (!session?.user?.id) return []

  // Validate/normalize URL params so invalid values don't 500.
  const parsed = experienceSearchSchema.safeParse(params ?? {})
  if (!parsed.success) return []

  return experienceService.getExperiences(session.user.id, parsed.data)
}

export async function getExperience(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    return await experienceService.getExperience(id, session.user.id, session.user.role)
  } catch {
    return null
  }
}

export async function getEvidence(experienceId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    if (!(await experienceService.canAccessExperience(experienceId, session.user.id, session.user.role))) {
      return []
    }
    const experience = await prisma.experience.findUnique({
      where: { id: experienceId },
      select: { evidence: { orderBy: { createdAt: "desc" } } },
    })
    return experience?.evidence ?? []
  } catch {
    return []
  }
}

export async function getExperienceStats() {
  const session = await auth()
  if (!session?.user?.id) return null

  return experienceService.getExperienceStats(session.user.id)
}

export async function getStrandProgress() {
  const session = await auth()
  if (!session?.user?.id) return null

  return experienceService.getStrandProgress(session.user.id)
}

export async function getOutcomeProgress() {
  const session = await auth()
  if (!session?.user?.id) return null

  return experienceService.getOutcomeProgress(session.user.id)
}

export async function getRecentDrafts(limit?: number) {
  const session = await auth()
  if (!session?.user?.id) return []

  return experienceService.getRecentDrafts(session.user.id, limit)
}

export async function getRecentActivity(limit?: number) {
  const session = await auth()
  if (!session?.user?.id) return []

  return experienceService.getRecentActivity(session.user.id, limit)
}

// ─── Profile ───────────────────────────────────────────────

export async function updateProfile(data: { name: string }): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    const profileSchema = z.object({
      name: z.string().min(1, "Name is required").max(100, "Name must be under 100 characters"),
    })

    const parsed = profileSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid name" }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    })

    revalidatePath("/settings/profile")
    revalidatePath("/dashboard")
    return { success: true, data: undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile"
    return { success: false, error: message }
  }
}
