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
