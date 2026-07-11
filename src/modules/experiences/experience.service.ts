import { prisma } from "@/lib/prisma"
import { NotFoundError } from "@/lib/errors"
import type { ExperienceSearchParams } from "./experience.types"
import type { ExperienceStatus, Role } from "@prisma/client"

// ponytail: owner-scoped queries enforce auth at the action layer, not here.
// The service assumes userId is already validated.

/** Check if a user can access an experience (owner, assigned teacher, or admin). */
async function canAccessExperience(experienceId: string, userId: string, role: Role): Promise<boolean> {
  if (role === "ADMIN") return true

  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { userId: true },
  })
  if (!experience) return false
  if (experience.userId === userId) return true

  if (role === "TEACHER") {
    const assignment = prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: userId, studentId: experience.userId } },
    })
    return !!(await assignment)
  }

  return false
}

export async function getExperience(id: string, userId: string, role: Role = "STUDENT") {
  const hasAccess = await canAccessExperience(id, userId, role)
  if (!hasAccess) throw new NotFoundError("Experience not found")

  const experience = await prisma.experience.findFirst({
    where: { id, deletedAt: null },
    include: {
      outcomes: true,
      strands: true,
      evidence: { orderBy: { createdAt: "desc" } },
      revisions: { orderBy: { createdAt: "desc" }, take: 10 },
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!experience) throw new NotFoundError("Experience not found")
  return experience
}

export async function getExperiences(userId: string, params: ExperienceSearchParams) {
  const { query, status, strand, outcome, sortBy, sortOrder } = params

  // Build where clause
  const where: Record<string, unknown> = {
    userId,
    deletedAt: null,
  }

  if (status) {
    where.status = status
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ]
  }

  if (strand) {
    where.strands = { some: { strand } }
  }

  if (outcome) {
    where.outcomes = { some: { outcome } }
  }

  const orderBy: Record<string, string> = {}
  orderBy[sortBy] = sortOrder

  const experiences = await prisma.experience.findMany({
    where,
    include: {
      outcomes: true,
      strands: true,
      evidence: { select: { id: true } },
      _count: { select: { evidence: true } },
    },
    orderBy,
  })

  return experiences.map((exp) => ({
    ...exp,
    evidenceCount: exp._count.evidence,
    _count: undefined,
  }))
}

export async function getExperienceStats(userId: string) {
  const [total, drafts, submitted, approved, archived, totalHours] = await Promise.all([
    prisma.experience.count({ where: { userId, deletedAt: null } }),
    prisma.experience.count({ where: { userId, deletedAt: null, status: "DRAFT" } }),
    prisma.experience.count({ where: { userId, deletedAt: null, status: "SUBMITTED" } }),
    prisma.experience.count({ where: { userId, deletedAt: null, status: "APPROVED" } }),
    prisma.experience.count({ where: { userId, deletedAt: null, status: "ARCHIVED" } }),
    prisma.experience.aggregate({
      where: { userId, deletedAt: null },
      _sum: { hours: true },
    }),
  ])

  return {
    total,
    drafts,
    submitted,
    approved,
    archived,
    totalHours: totalHours._sum.hours ?? 0,
  }
}

// ponytail: strand/outcome progress is a handful of simple counts, no aggregation pipeline needed.
export async function getStrandProgress(userId: string) {
  const experiences = await prisma.experience.findMany({
    where: { userId, deletedAt: null },
    select: { strands: { select: { strand: true } } },
  })

  const counts = { CREATIVITY: 0, ACTIVITY: 0, SERVICE: 0 }
  for (const exp of experiences) {
    for (const s of exp.strands) {
      counts[s.strand as keyof typeof counts]++
    }
  }
  return counts
}

export async function getOutcomeProgress(userId: string) {
  const experiences = await prisma.experience.findMany({
    where: { userId, deletedAt: null, status: { in: ["APPROVED", "SUBMITTED"] } },
    select: { outcomes: { select: { outcome: true } } },
  })

  const outcomes = new Set<string>()
  for (const exp of experiences) {
    for (const o of exp.outcomes) {
      outcomes.add(o.outcome)
    }
  }
  return { completed: outcomes.size, total: 7 }
}

export async function getRecentDrafts(userId: string, limit = 5) {
  return prisma.experience.findMany({
    where: { userId, deletedAt: null, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      strands: { select: { strand: true } },
    },
  })
}

export async function getRecentActivity(userId: string, limit = 10) {
  // Ponytail: derive activity from revisions + recent experience updates.
  // No dedicated Activity model needed yet.
  const [revisions, recentExperiences] = await Promise.all([
    prisma.experienceRevision.findMany({
      where: { experience: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        experience: { select: { id: true, title: true } },
      },
    }),
    prisma.experience.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        status: true,
      },
    }),
  ])

  // Merge into a unified activity feed
  type ActivityItem = {
    id: string
    type: "created" | "updated" | "revision"
    experienceId: string
    experienceTitle: string
    timestamp: Date
  }

  const items: ActivityItem[] = []

  for (const exp of recentExperiences) {
    items.push({
      id: `created-${exp.id}`,
      type: "created",
      experienceId: exp.id,
      experienceTitle: exp.title,
      timestamp: exp.createdAt,
    })
    if (exp.updatedAt > exp.createdAt) {
      items.push({
        id: `updated-${exp.id}`,
        type: "updated",
        experienceId: exp.id,
        experienceTitle: exp.title,
        timestamp: exp.updatedAt,
      })
    }
  }

  for (const rev of revisions) {
    items.push({
      id: `revision-${rev.id}`,
      type: "revision",
      experienceId: rev.experience.id,
      experienceTitle: rev.experience.title,
      timestamp: rev.createdAt,
    })
  }

  // Dedupe by experience+type, keep latest, sort, trim
  const map = new Map<string, ActivityItem>()
  for (const item of items) {
    const key = `${item.type}-${item.experienceId}`
    if (!map.has(key) || map.get(key)!.timestamp < item.timestamp) {
      map.set(key, item)
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

export async function createExperience(
  userId: string,
  data: {
    title: string
    date: Date
    description?: string
    reflection?: string
    supervisor?: string
    hours?: number
    location?: string
    notes?: string
    isGroup?: boolean
    strands?: string[]
    outcomes?: string[]
  }
) {
  return prisma.experience.create({
    data: {
      userId,
      title: data.title,
      date: data.date,
      description: data.description,
      reflection: data.reflection,
      supervisor: data.supervisor,
      hours: data.hours,
      location: data.location,
      notes: data.notes,
      isGroup: data.isGroup ?? false,
      strands: data.strands?.length
        ? { create: data.strands.map((strand) => ({ strand: strand as "CREATIVITY" | "ACTIVITY" | "SERVICE" })) }
        : undefined,
      outcomes: data.outcomes?.length
        ? { create: data.outcomes.map((outcome) => ({ outcome })) }
        : undefined,
    },
    include: {
      outcomes: true,
      strands: true,
    },
  })
}

export async function updateExperience(
  id: string,
  userId: string,
  data: {
    title: string
    date: Date
    description?: string
    reflection?: string
    supervisor?: string
    hours?: number
    location?: string
    notes?: string
    isGroup?: boolean
    strands?: string[]
    outcomes?: string[]
  }
) {
  // Ownership check
  const existing = await prisma.experience.findFirst({
    where: { id, userId, deletedAt: null },
  })
  if (!existing) throw new NotFoundError("Experience not found")

  // Create revision snapshot before update
  await prisma.experienceRevision.create({
    data: {
      experienceId: id,
      snapshot: {
        title: existing.title,
        date: existing.date,
        description: existing.description,
        reflection: existing.reflection,
        supervisor: existing.supervisor,
        hours: existing.hours,
        location: existing.location,
        notes: existing.notes,
        isGroup: existing.isGroup,
        status: existing.status,
        updatedAt: existing.updatedAt,
      },
    },
  })

  // Update with new strands and outcomes
  return prisma.experience.update({
    where: { id },
    data: {
      title: data.title,
      date: data.date,
      description: data.description,
      reflection: data.reflection,
      supervisor: data.supervisor,
      hours: data.hours,
      location: data.location,
      notes: data.notes,
      isGroup: data.isGroup ?? false,
      // Replace strands
      strands: data.strands !== undefined
        ? {
            deleteMany: {},
            create: data.strands.map((strand) => ({ strand: strand as "CREATIVITY" | "ACTIVITY" | "SERVICE" })),
          }
        : undefined,
      // Replace outcomes
      outcomes: data.outcomes !== undefined
        ? {
            deleteMany: {},
            create: data.outcomes.map((outcome) => ({ outcome })),
          }
        : undefined,
    },
    include: {
      outcomes: true,
      strands: true,
      evidence: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function updateExperienceStatus(
  id: string,
  userId: string,
  status: ExperienceStatus
) {
  const existing = await prisma.experience.findFirst({
    where: { id, userId, deletedAt: null },
  })
  if (!existing) throw new NotFoundError("Experience not found")

  return prisma.experience.update({
    where: { id },
    data: { status },
  })
}

export async function softDeleteExperience(id: string, userId: string) {
  const existing = await prisma.experience.findFirst({
    where: { id, userId, deletedAt: null },
  })
  if (!existing) throw new NotFoundError("Experience not found")

  return prisma.experience.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export async function restoreExperience(id: string, userId: string) {
  const existing = await prisma.experience.findFirst({
    where: { id, userId, deletedAt: { not: null } },
  })
  if (!existing) throw new NotFoundError("Deleted experience not found")

  return prisma.experience.update({
    where: { id },
    data: { deletedAt: null },
  })
}

// ─── Evidence ─────────────────────────────────────────────

export async function addEvidence(
  experienceId: string,
  userId: string,
  data: {
    type: "IMAGE" | "VIDEO" | "PDF" | "LINK"
    url: string
    filename: string
    mimeType: string
    size: number
    thumbnailUrl?: string
  }
) {
  // Ownership check
  const existing = await prisma.experience.findFirst({
    where: { id: experienceId, userId, deletedAt: null },
  })
  if (!existing) throw new NotFoundError("Experience not found")

  return prisma.evidence.create({
    data: {
      experienceId,
      type: data.type,
      url: data.url,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      thumbnailUrl: data.thumbnailUrl,
    },
  })
}

export async function removeEvidence(id: string, userId: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { experience: { select: { userId: true } } },
  })
  if (!evidence || evidence.experience.userId !== userId) {
    throw new NotFoundError("Evidence not found")
  }

  return prisma.evidence.delete({ where: { id } })
}
