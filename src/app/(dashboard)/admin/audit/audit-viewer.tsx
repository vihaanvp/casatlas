"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAuditLogs } from "@/lib/audit"

type AuditAction = "LOGIN" | "LOGOUT" | "ACCOUNT_LINKED" | "EXPERIENCE_CREATED" | "EXPERIENCE_UPDATED" | "EXPERIENCE_DELETED" | "EXPERIENCE_SUBMITTED" | "EXPERIENCE_APPROVED" | "EXPERIENCE_REVISION_REQUESTED" | "COMMENT_ADDED" | "USER_ROLE_CHANGED" | "TEACHER_ASSIGNED" | "TEACHER_UNASSIGNED" | "CONFIG_CHANGED"

interface AuditLogEntry {
  id: string
  action: AuditAction
  entity: string | null
  entityId: string | null
  details: Record<string, unknown> | null
  ip: string | null
  createdAt: Date
  user: { id: string; name: string | null; email: string | null } | null
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadLogs() {
      setLoading(true)
      try {
        const result = await getAuditLogs({
          page,
          pageSize: 30,
          action: actionFilter || undefined,
        })
        if (!cancelled) {
          setLogs(result.logs as AuditLogEntry[])
          setTotal(result.total)
        }
      } catch {
        // ponytail: silent fail for audit viewer
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadLogs()
    return () => { cancelled = true }
  }, [page, actionFilter])

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value as AuditAction | ""); setPage(1) }}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">All Actions</option>
          {(["LOGIN", "EXPERIENCE_CREATED", "EXPERIENCE_APPROVED", "EXPERIENCE_DELETED", "COMMENT_ADDED", "USER_ROLE_CHANGED", "TEACHER_ASSIGNED"] as AuditAction[]).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="text-sm text-[var(--color-text-muted)] self-center">{total} total entries</span>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No audit logs found</p>
      ) : (
        <Card className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono">{log.action}</Badge>
                {log.entity && <span className="text-xs text-[var(--color-text-muted)]">{log.entity}</span>}
                {log.entityId && <span className="text-xs text-[var(--color-text-muted)] font-mono truncate max-w-[100px]">{log.entityId}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {log.user?.name ?? log.user?.email ?? "System"}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {log.details && (
                <pre className="mt-1 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Pagination */}
      {total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-[var(--color-text-muted)] self-center">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={logs.length < 30}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
