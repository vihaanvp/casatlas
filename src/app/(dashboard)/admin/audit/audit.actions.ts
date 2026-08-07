"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import type { AuditAction } from "@prisma/client"

/** Query audit logs with pagination. Admin only. */
export async function getAuditLogs(params: {
  page?: number
  pageSize?: number
  action?: AuditAction
  userId?: string
  entity?: string
  from?: Date
  to?: Date
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "ADMIN") throw new Error("Insufficient permissions: requires view_audit_logs")

  const { page = 1, pageSize = 50, action, userId, entity, from, to } = params
  const skip = (page - 1) * pageSize

  const where = {
    ...(action && { action }),
    ...(userId && { userId }),
    ...(entity && { entity }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
