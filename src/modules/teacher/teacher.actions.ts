"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { auditLog } from "@/lib/audit"
import { createNotification } from "@/lib/notifications"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const idSchema = z.string().min(1, "ID is required")

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
            select: { id: true, status: true, title: true, date: true, createdAt: true },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  })

  return (await assignments).map((a: { student: { id: string; name: string | null; email: string | null; image: string | null; createdAt: Date; experiences: { id: string; status: string; title: string; date: Date; createdAt: Date }[] } }) => a.student)
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

  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, title: true } })
  if (!experience) throw new Error("Experience not found")

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

  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, title: true } })
  if (!experience) throw new Error("Experience not found")

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

  const comment = await prisma.comment.create({
    data: { experienceId, userId: session.user.id, content: parsed.data.content, parentId: parsed.data.parentId ?? null },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  // Notify experience owner if commenter is not the owner
  const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { userId: true, title: true } })
  if (experience && experience.userId !== session.user.id) {
    await createNotification({
      userId: experience.userId,
      type: "TEACHER_COMMENT",
      title: "New Comment",
      message: `${session.user.name ?? "Teacher"} commented on "${experience.title}"`,
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
