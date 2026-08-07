"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EXPERIENCE_STATUS_LABELS, EXPERIENCE_STATUS_COLORS } from "@/lib/constants"
import { approveExperiences, requestRevisions } from "@/modules/teacher/teacher.actions"
import { Check, X } from "lucide-react"

export type PendingExperience = {
  id: string
  title: string
  date: string
  status: string
  user: { name: string | null; email: string | null }
  strands: { strand: string }[]
}

export function PendingReviewsList({ experiences }: { experiences: PendingExperience[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [showRevision, setShowRevision] = useState(false)
  const [reason, setReason] = useState("")

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    setSelected(selected.size === experiences.length ? new Set() : new Set(experiences.map((e) => e.id)))
  }

  const clear = () => {
    setSelected(new Set())
    setShowRevision(false)
    setReason("")
  }

  async function run(action: () => Promise<{ success: boolean; count?: number }>) {
    setBusy(true)
    try {
      const result = await action()
      toast.success(`${result.count ?? selected.size} updated`)
      clear()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Select-all + batch action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {selected.size === experiences.length ? "Clear all" : "Select all"}
        </Button>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-[var(--color-text-muted)]">{selected.size} selected</span>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={busy}
              onClick={() => run(() => approveExperiences([...selected]))}
            >
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setShowRevision((v) => !v)}>
              <X className="h-4 w-4" />
              Request revision
            </Button>
          </>
        )}
      </div>

      {/* Shared revision reason */}
      {showRevision && selected.size > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 p-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Reason for revision (sent to ${selected.size} student${selected.size !== 1 ? "s" : ""})...`}
            className="min-h-[70px] bg-[var(--color-surface)]"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRevision(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!reason.trim() || busy}
              onClick={() => run(() => requestRevisions([...selected], reason.trim()))}
            >
              Send revision request
            </Button>
          </div>
        </Card>
      )}

      {experiences.map((exp) => {
        const checked = selected.has(exp.id)
        return (
          <Card key={exp.id} className="p-4 bg-[var(--color-surface)]">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(exp.id)}
                aria-label={`Select ${exp.title}`}
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/experiences/${exp.id}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:underline">
                  {exp.title}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  by {exp.user.name ?? exp.user.email} · {new Date(exp.date).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {exp.strands.map((s) => (
                    <Badge key={s.strand} variant="outline" className="text-xs">
                      {s.strand}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge className={`${EXPERIENCE_STATUS_COLORS[exp.status as keyof typeof EXPERIENCE_STATUS_COLORS]} border text-xs`}>
                {EXPERIENCE_STATUS_LABELS[exp.status as keyof typeof EXPERIENCE_STATUS_LABELS]}
              </Badge>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
