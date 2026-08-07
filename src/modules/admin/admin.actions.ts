"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { auditLog } from "@/lib/audit"
import { getConfigValue, setConfigValue } from "@/lib/app-config"
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

  // Don't allow demoting the last remaining admin — would lock out the system.
  if (parsedRole.data !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (adminCount <= 1 && target?.role === "ADMIN") {
      throw new Error("Cannot demote the last admin")
    }
  }

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

  // Validate that teacher is a TEACHER and all students are STUDENTs.
  const [teacher, students] = await Promise.all([
    prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } }),
    prisma.user.findMany({ where: { id: { in: parsedStudentIds.data } }, select: { id: true, role: true } }),
  ])
  if (teacher?.role !== "TEACHER") throw new Error("Teacher must have the TEACHER role")
  const validStudentIds = students.filter((s) => s.role === "STUDENT").map((s) => s.id)
  if (validStudentIds.length !== new Set(parsedStudentIds.data).size) {
    throw new Error("Some students are not valid STUDENT accounts")
  }

  // Diff against existing assignments so re-saving doesn't wipe the roster.
  const existing = await prisma.teacherStudent.findMany({
    where: { teacherId },
    select: { studentId: true },
  })
  const existingSet = new Set(existing.map((e) => e.studentId))
  const targetSet = new Set(validStudentIds)
  const toRemove = [...existingSet].filter((id) => !targetSet.has(id))
  const toAdd = validStudentIds.filter((id) => !existingSet.has(id))

  await prisma.$transaction([
    ...(toRemove.length ? [prisma.teacherStudent.deleteMany({ where: { teacherId, studentId: { in: toRemove } } })] : []),
    ...toAdd.map((studentId) =>
      prisma.teacherStudent.create({ data: { teacherId, studentId } })
    ),
  ])

  auditLog({
    userId: session.user.id,
    action: "TEACHER_ASSIGNED",
    entity: "TeacherStudent",
    entityId: teacherId,
    details: { studentIds: validStudentIds },
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

// ─── Student Roster for assignment manager ───────────────

/** Fetch all students for the assignment UI (role-scoped). */
export async function getAllStudents() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  })
  return students
}

// ─── System Stats ───────────────────────────────────────

export async function getSystemStats() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // Only count evidence/comments belonging to non-deleted experiences so the
  // stats stay consistent with totalExperiences.
  const [totalUsers, totalExperiences, totalUploads, totalComments] =
    await Promise.all([
      prisma.user.count(),
      prisma.experience.count({ where: { deletedAt: null } }),
      prisma.evidence.count({ where: { experience: { deletedAt: null } } }),
      prisma.comment.count({ where: { experience: { deletedAt: null } } }),
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

// ─── Runtime Config (registration toggle) ────────────────

/** Current registration state: true when registration is open. */
export async function getRegistrationState() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const value = await getConfigValue("ALLOW_REGISTRATION")
  // DB value wins; fall back to env default when never set.
  return value === null ? process.env.ALLOW_REGISTRATION !== "false" : value !== "false"
}

/** Set registration state at runtime (no redeploy needed). */
export async function setRegistrationState(open: boolean) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = z.boolean().safeParse(open)
  if (!parsed.success) throw new Error("Invalid value")

  await setConfigValue("ALLOW_REGISTRATION", String(parsed.data))

  auditLog({
    userId: session.user.id,
    action: "CONFIG_CHANGED",
    entity: "AppConfig",
    details: { key: "ALLOW_REGISTRATION", value: parsed.data },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/settings")
  return { success: true }
}

// ─── Permanent Delete ───────────────────────────────────

export async function permanentlyDeleteExperience(experienceId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, title: true, userId: true },
  })
  if (!experience) throw new Error("Experience not found")

  await prisma.experience.delete({ where: { id: experienceId } })

  auditLog({
    userId: session.user.id,
    action: "EXPERIENCE_DELETED",
    entity: "Experience",
    entityId: experienceId,
    details: { permanent: true, title: experience.title, ownerId: experience.userId },
  })

  revalidatePath("/admin")
  return { success: true }
}
