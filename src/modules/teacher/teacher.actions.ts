"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { auditLog } from "@/lib/audit"
import { createNotification } from "@/lib/notifications"
import { canAccessExperience } from "@/modules/experiences/experience.service"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Role } from "@prisma/client"

const idSchema = z.string().min(1, "ID is required")

/** True if the teacher is assigned to the student. */
async function isAssignedTo(teacherId: string, studentId: string): Promise<boolean> {
  const assignment = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId, studentId } },
  })
  return !!assignment
}

/** Users whose name (or email local-part) matches an @mention token. */
async function resolveMentions(content: string) {
  const tokens = Array.from(content.matchAll(/(?:^|\s)@([A-Za-z0-9_.-]+)/g))
    .map((m) => m[1])
    .filter(Boolean)
  if (tokens.length === 0) return []

  const unique = [...new Set(tokens.map((t) => t.toLowerCase()))]

  // Match name OR email local-part (e.g. "@jdoe" → jdoe@school.org).
  const [nameMatches, emailMatches] = await Promise.all([
    prisma.user.findMany({
      where: { name: { in: unique, mode: "insensitive" as const } },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: { OR: unique.map((t) => ({ email: { startsWith: `${t}@`, mode: "insensitive" as const } })) },
      select: { id: true },
    }),
  ])

  const seen = new Set<string>()
  return [...nameMatches, ...emailMatches].filter((u) => {
    if (seen.has(u.id)) return false
    seen.add(u.id)
    return true
  })
}

// ─── Teacher's Assigned Students ────────────────────────

export async function getMyStudents() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const assignments = prisma.teacherStudent.findMany({
    where: { teacherId: session.user.id },
    include: {
      student: {
        select: {
          id: true, name: true, email: true, image: true, createdAt: true,
          experiences: {
            where: { deletedAt: null },
            select: {
              id: true, status: true, title: true, date: true, createdAt: true, hours: true,
              strands: { select: { strand: true } },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  })

  // Annotate each student with approval progress + hours for the roster UI.
  return (await assignments).map((a) => {
    const student = a.student
    const approved = student.experiences.filter((e) => e.status === "APPROVED")
    const hours = approved.reduce((sum, e) => sum + (e.hours ?? 0), 0)
    const strandCount = new Set(approved.flatMap((e) => e.strands.map((s) => s.strand))).size
    return { ...student, approvedCount: approved.length, totalHours: hours, strandCount }
  })
}

// ─── Pending Reviews ────────────────────────────────────

export async function getPendingReviews() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // Get student IDs assigned to this teacher
  const assignments = prisma.teacherStudent.findMany({
    where: { teacherId: session.user.id },
    select: { studentId: true },
  })
  const studentIds = (await assignments).map((a) => a.studentId)

  // Admins see all submitted; teachers see only assigned students
  const where = {
    status: "SUBMITTED" as const,
    deletedAt: null,
    ...(session.user.role !== "ADMIN" && { userId: { in: studentIds } }),
  }

  const [experiences, total] = await Promise.all([
    prisma.experience.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        strands: { select: { strand: true } },
        outcomes: { select: { outcome: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.experience.count({ where }),
  ])

  return { experiences, total }
}

// ─── Review Actions ─────────────────────────────────────

export async function approveExperience(experienceId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const parsedId = idSchema.safeParse(experienceId)
  if (!parsedId.success) throw new Error("Invalid experience ID")

  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, title: true, status: true, deletedAt: true } })
  if (!experience || experience.deletedAt) throw new Error("Experience not found")
  if (experience.status !== "SUBMITTED") throw new Error("Only submitted experiences can be approved")
  if (session.user.role !== "ADMIN" && !(await isAssignedTo(session.user.id, experience.userId))) {
    throw new Error("You are not assigned to this student")
  }

  await prisma.experience.update({ where: { id: experienceId }, data: { status: "APPROVED" } })

  auditLog({ userId: session.user.id, action: "EXPERIENCE_APPROVED", entity: "Experience", entityId: experienceId })
  await createNotification({
    userId: experience.userId,
    type: "EXPERIENCE_APPROVED",
    title: "Experience Approved",
    message: `"${experience.title}" has been approved.`,
    link: `/experiences/${experienceId}`,
  })

  revalidatePath("/teacher")
  revalidatePath(`/experiences/${experienceId}`)
  return { success: true }
}

export async function requestRevision(experienceId: string, reason: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const revisionSchema = z.object({
    experienceId: idSchema,
    reason: z.string().min(1, "Reason is required").max(2000, "Reason must be under 2000 characters"),
  })
  const parsed = revisionSchema.safeParse({ experienceId, reason })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input")

  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, title: true, status: true, deletedAt: true } })
  if (!experience || experience.deletedAt) throw new Error("Experience not found")
  if (experience.status !== "SUBMITTED") throw new Error("Only submitted experiences can be revised")
  if (session.user.role !== "ADMIN" && !(await isAssignedTo(session.user.id, experience.userId))) {
    throw new Error("You are not assigned to this student")
  }

  await prisma.experience.update({ where: { id: experienceId }, data: { status: "NEEDS_REVISION" } })

  auditLog({ userId: session.user.id, action: "EXPERIENCE_REVISION_REQUESTED", entity: "Experience", entityId: experienceId, details: { reason } })
  await createNotification({
    userId: experience.userId,
    type: "REVISION_REQUESTED",
    title: "Revision Requested",
    message: `Teacher requested revision on "${experience.title}": ${reason}`,
    link: `/experiences/${experienceId}`,
  })

  revalidatePath("/teacher")
  revalidatePath(`/experiences/${experienceId}`)
  return { success: true }
}

// ─── Batch Review ────────────────────────────────────────

const idsArraySchema = z.array(idSchema).min(1).max(50, "Too many experiences at once")

/** Validate a set of experiences is reviewable by this session; returns them. */
async function reviewableExperiences(
  session: { user: { id: string; role: string } },
  ids: string[],
  allowedStatus: "SUBMITTED" | "APPROVED" | "NEEDS_REVISION"
) {
  const experiences = await prisma.experience.findMany({
    where: { id: { in: ids }, deletedAt: null, status: allowedStatus },
    select: { id: true, userId: true, title: true },
  })
  if (experiences.length !== ids.length) {
    throw new Error("Some experiences are not reviewable")
  }
  for (const exp of experiences) {
    if (session.user.role !== "ADMIN" && !(await isAssignedTo(session.user.id, exp.userId))) {
      throw new Error("You are not assigned to one of these students")
    }
  }
  return experiences
}

/** Approve several submitted experiences at once. */
export async function approveExperiences(experienceIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = idsArraySchema.safeParse(experienceIds)
  if (!parsed.success) throw new Error("Invalid experience IDs")

  const experiences = await reviewableExperiences(session, parsed.data, "SUBMITTED")

  await prisma.experience.updateMany({
    where: { id: { in: parsed.data } },
    data: { status: "APPROVED" },
  })

  auditLog({
    userId: session.user.id,
    action: "EXPERIENCE_APPROVED",
    entity: "Experience",
    entityId: experiences[0].id,
    details: { count: experiences.length, ids: experiences.map((e) => e.id) },
  })

  for (const exp of experiences) {
    await createNotification({
      userId: exp.userId,
      type: "EXPERIENCE_APPROVED",
      title: "Experience Approved",
      message: `"${exp.title}" has been approved.`,
      link: `/experiences/${exp.id}`,
    })
  }

  revalidatePath("/teacher")
  return { success: true, count: experiences.length }
}

/** Request revision on several submitted experiences at once (shared reason). */
export async function requestRevisions(experienceIds: string[], reason: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = idsArraySchema.safeParse(experienceIds)
  if (!parsed.success) throw new Error("Invalid experience IDs")

  const parsedReason = z.string().min(1, "Reason is required").max(2000, "Reason must be under 2000 characters").trim().safeParse(reason)
  if (!parsedReason.success) throw new Error(parsedReason.error.issues[0]?.message ?? "Invalid reason")

  const experiences = await reviewableExperiences(session, parsed.data, "SUBMITTED")

  await prisma.experience.updateMany({
    where: { id: { in: parsed.data } },
    data: { status: "NEEDS_REVISION" },
  })

  auditLog({
    userId: session.user.id,
    action: "EXPERIENCE_REVISION_REQUESTED",
    entity: "Experience",
    entityId: experiences[0].id,
    details: { count: experiences.length, reason: parsedReason.data, ids: experiences.map((e) => e.id) },
  })

  for (const exp of experiences) {
    await createNotification({
      userId: exp.userId,
      type: "REVISION_REQUESTED",
      title: "Revision Requested",
      message: `Teacher requested revision on "${exp.title}": ${parsedReason.data}`,
      link: `/experiences/${exp.id}`,
    })
  }

  revalidatePath("/teacher")
  return { success: true, count: experiences.length }
}

// ─── Comments ───────────────────────────────────────────

export async function addComment(experienceId: string, content: string, parentId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const commentSchema = z.object({
    experienceId: idSchema,
    content: z.string().min(1, "Comment cannot be empty").max(5000, "Comment must be under 5000 characters").trim(),
    parentId: idSchema.optional(),
  })
  const parsed = commentSchema.safeParse({ experienceId, content, parentId })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input")

  // Owner, assigned teacher, or admin may comment.
  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, deletedAt: true, title: true } })
  if (!experience || experience.deletedAt) throw new Error("Experience not found")
  if (!(await canAccessExperience(experienceId, session.user.id, session.user.role as Role))) {
    throw new Error("You do not have access to this experience")
  }

  // Parent reply must belong to the same experience.
  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parsed.data.parentId }, select: { experienceId: true } })
    if (!parent || parent.experienceId !== experienceId) {
      throw new Error("Parent comment not found")
    }
  }

  const comment = await prisma.comment.create({
    data: { experienceId, userId: session.user.id, content: parsed.data.content, parentId: parsed.data.parentId ?? null },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  // Notify experience owner if commenter is not the owner
  if (experience.userId !== session.user.id) {
    await createNotification({
      userId: experience.userId,
      type: "TEACHER_COMMENT",
      title: "New Comment",
      message: `${session.user.name ?? "Teacher"} commented on "${experience.title}"`,
      link: `/experiences/${experienceId}`,
    })
  }

  // @mention notify: "@name" or "@email-local-part" → notify those users
  // (excluding the commenter and the owner already notified above).
  const mentioned = await resolveMentions(parsed.data.content)
  const alreadyNotified = new Set([experience.userId, session.user.id])
  for (const user of mentioned) {
    if (alreadyNotified.has(user.id)) continue
    alreadyNotified.add(user.id)
    await createNotification({
      userId: user.id,
      type: "TEACHER_COMMENT",
      title: "You were mentioned",
      message: `${session.user.name ?? "Someone"} mentioned you in a comment on "${experience.title}"`,
      link: `/experiences/${experienceId}`,
    })
  }

  auditLog({ userId: session.user.id, action: "COMMENT_ADDED", entity: "Comment", entityId: comment.id, details: { experienceId } })

  revalidatePath(`/experiences/${experienceId}`)
  return { success: true, comment }
}

export async function getComments(experienceId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, deletedAt: true } })
  if (!experience || experience.deletedAt) throw new Error("Experience not found")
  if (!(await canAccessExperience(experienceId, session.user.id, session.user.role as Role))) {
    throw new Error("You do not have access to this experience")
  }

  return prisma.comment.findMany({
    where: { experienceId, parentId: null },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      replies: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

// ─── Teacher Dashboard Stats ────────────────────────────

export async function getTeacherStats() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const assignments = prisma.teacherStudent.findMany({
    where: { teacherId: session.user.id },
    select: { studentId: true },
  })
  const studentIds = (await assignments).map((a) => a.studentId)

  const studentFilter = session.user.role !== "ADMIN"
    ? { userId: { in: studentIds } }
    : {}

  const [pendingCount, approvedCount, revisionCount, studentCount] = await Promise.all([
    prisma.experience.count({ where: { status: "SUBMITTED", deletedAt: null, ...studentFilter } }),
    prisma.experience.count({ where: { status: "APPROVED", deletedAt: null, ...studentFilter } }),
    prisma.experience.count({ where: { status: "NEEDS_REVISION", deletedAt: null, ...studentFilter } }),
    prisma.user.count({ where: { role: "STUDENT", ...(session.user.role !== "ADMIN" ? { id: { in: studentIds } } : {}) } }),
  ])

  return { pendingCount, approvedCount, revisionCount, studentCount }
}
