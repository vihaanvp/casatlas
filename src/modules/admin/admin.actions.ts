"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { auditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const roleSchema = z.enum(["STUDENT", "TEACHER", "ADMIN"])
const idSchema = z.string().min(1, "ID is required")

// ─── User Management ────────────────────────────────────

export async function getUsers(params?: { page?: number; pageSize?: number; role?: string; search?: string }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const { page = 1, pageSize = 20, role, search } = params ?? {}
  const skip = (page - 1) * pageSize

  const where = {
    ...(role && { role: role as "STUDENT" | "TEACHER" | "ADMIN" }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, image: true, role: true, createdAt: true,
        _count: { select: { experiences: true, assignedStudents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function updateUserRole(userId: string, role: "STUDENT" | "TEACHER" | "ADMIN") {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const parsedUserId = idSchema.safeParse(userId)
  const parsedRole = roleSchema.safeParse(role)
  if (!parsedUserId.success || !parsedRole.success) {
    throw new Error("Invalid input")
  }
  if (userId === session.user.id) throw new Error("Cannot change your own role")

  const user = await prisma.user.update({ where: { id: userId }, data: { role: parsedRole.data } })

  auditLog({
    userId: session.user.id,
    action: "USER_ROLE_CHANGED",
    entity: "User",
    entityId: userId,
    details: { newRole: role },
  })

  revalidatePath("/admin")
  return { success: true, user }
}

// ─── Teacher Assignments ────────────────────────────────

export async function getTeachers() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  return prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true, name: true, email: true, image: true,
      _count: { select: { assignedStudents: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function assignStudents(teacherId: string, studentIds: string[]) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const parsedTeacherId = idSchema.safeParse(teacherId)
  if (!parsedTeacherId.success) throw new Error("Invalid teacher ID")

  const studentIdArraySchema = z.array(idSchema).max(100, "Too many students")
  const parsedStudentIds = studentIdArraySchema.safeParse(studentIds)
  if (!parsedStudentIds.success) throw new Error("Invalid student IDs")

  await prisma.$transaction([
    prisma.teacherStudent.deleteMany({ where: { teacherId } }),
    ...parsedStudentIds.data.map((studentId) =>
      prisma.teacherStudent.create({ data: { teacherId, studentId } })
    ),
  ])

  auditLog({
    userId: session.user.id,
    action: "TEACHER_ASSIGNED",
    entity: "TeacherStudent",
    entityId: teacherId,
    details: { studentIds },
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function getTeacherAssignments(teacherId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (session.user.role !== "ADMIN" && session.user.id !== teacherId) throw new Error("Unauthorized")

  const assignments = await prisma.teacherStudent.findMany({
    where: { teacherId },
    include: {
      student: {
        select: {
          id: true, name: true, email: true, image: true,
          _count: { select: { experiences: true } },
        },
      },
    },
  })

  return assignments.map((a) => a.student)
}

// ─── System Stats ───────────────────────────────────────

export async function getSystemStats() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const [totalUsers, totalExperiences, totalUploads, totalComments] =
    await Promise.all([
      prisma.user.count(),
      prisma.experience.count({ where: { deletedAt: null } }),
      prisma.evidence.count(),
      prisma.comment.count(),
    ])

  // Group by role manually (Prisma groupBy doesn't support 'role' field after migration)
  const [students, teachers, admins] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ])

  const [drafts, submitted, approved, needsRevision, archived] = await Promise.all([
    prisma.experience.count({ where: { deletedAt: null, status: "DRAFT" } }),
    prisma.experience.count({ where: { deletedAt: null, status: "SUBMITTED" } }),
    prisma.experience.count({ where: { deletedAt: null, status: "APPROVED" } }),
    prisma.experience.count({ where: { deletedAt: null, status: "NEEDS_REVISION" } }),
    prisma.experience.count({ where: { deletedAt: null, status: "ARCHIVED" } }),
  ])

  return {
    totalUsers,
    usersByRole: { STUDENT: students, TEACHER: teachers, ADMIN: admins },
    totalExperiences,
    experiencesByStatus: { DRAFT: drafts, SUBMITTED: submitted, APPROVED: approved, NEEDS_REVISION: needsRevision, ARCHIVED: archived },
    totalUploads,
    totalComments,
  }
}

// ─── Permanent Delete ───────────────────────────────────

export async function permanentlyDeleteExperience(experienceId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.experience.delete({ where: { id: experienceId } })

  auditLog({
    userId: session.user.id,
    action: "EXPERIENCE_DELETED",
    entity: "Experience",
    entityId: experienceId,
    details: { permanent: true },
  })

  revalidatePath("/admin")
  return { success: true }
}
