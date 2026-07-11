import { prisma } from "@/lib/prisma"
import { type AuditAction } from "@prisma/client"

interface AuditLogEntry {
  userId?: string
  action: AuditAction
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
  ip?: string
}

/** Log an auditable event. Fire-and-forget — never blocks the caller. */
export function auditLog(entry: AuditLogEntry): void {
  prisma.auditLog
    .create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity ?? null,
        entityId: entry.entityId ?? null,
        details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
        ip: entry.ip ?? null,
      },
    })
    .catch(() => {
      // ponytail: audit log failure must never break the app
    })
}

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
