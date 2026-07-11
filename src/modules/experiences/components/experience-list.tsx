"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ExperienceCard } from "./experience-card"
import { formatDateShort } from "@/lib/utils"
import { EXPERIENCE_STATUS_LABELS, EXPERIENCE_STATUS_COLORS, CAS_STRAND_LABELS } from "@/lib/constants"
import type { ExperienceStatus } from "@prisma/client"
import { LayoutGrid, List } from "lucide-react"

type Strand = { strand: string }
type Outcome = { outcome: string }

type ExperienceItem = {
  id: string
  title: string
  date: Date | string
  status: ExperienceStatus
  updatedAt: Date | string
  strands: Strand[]
  outcomes: Outcome[]
  evidenceCount: number
}

interface ExperienceListProps {
  experiences: ExperienceItem[]
}

const STRAND_COLORS: Record<string, string> = {
  CREATIVITY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ACTIVITY: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SERVICE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

function TableView({ experiences }: { experiences: ExperienceItem[] }) {
  if (experiences.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Title</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Date</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Status</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Strands</th>
            <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">Outcomes</th>
            <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {experiences.map((exp) => (
            <tr
              key={exp.id}
              className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/experiences/${exp.id}`}
                  className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {exp.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {formatDateShort(exp.date)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                    EXPERIENCE_STATUS_COLORS[exp.status]
                  )}
                >
                  {EXPERIENCE_STATUS_LABELS[exp.status]}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {exp.strands.map((s) => (
                    <span
                      key={s.strand}
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        STRAND_COLORS[s.strand] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}
                    >
                      {CAS_STRAND_LABELS[s.strand as keyof typeof CAS_STRAND_LABELS] ?? s.strand}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-center text-[var(--color-text-secondary)]">
                {exp.outcomes.length}
              </td>
              <td className="px-4 py-3 text-center text-[var(--color-text-secondary)]">
                {exp.evidenceCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center">
      <p className="text-lg font-medium text-[var(--color-text-primary)]">No experiences found</p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Try adjusting your filters or create a new experience.
      </p>
    </div>
  )
}

function ExperienceList({ experiences }: ExperienceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewMode = searchParams.get("view") === "table" ? "table" : "card"

  const setView = React.useCallback(
    (mode: "card" | "table") => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("view", mode)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-1" role="group" aria-label="View mode">
        <Button
          variant={viewMode === "card" ? "default" : "ghost"}
          size="icon"
          onClick={() => setView("card")}
          aria-label="Card view"
          aria-pressed={viewMode === "card"}
          className="h-8 w-8"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "ghost"}
          size="icon"
          onClick={() => setView("table")}
          aria-label="Table view"
          aria-pressed={viewMode === "table"}
          className="h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {experiences.length === 0 ? (
        <EmptyState />
      ) : viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} />
          ))}
        </div>
      ) : (
        <TableView experiences={experiences} />
      )}
    </div>
  )
}

export { ExperienceList }
