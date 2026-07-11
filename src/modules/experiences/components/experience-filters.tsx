"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { EXPERIENCE_STATUSES, EXPERIENCE_STATUS_LABELS, CAS_STRANDS, CAS_STRAND_LABELS } from "@/lib/constants"
import { SlidersHorizontal, ArrowUpDown } from "lucide-react"

const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "title", label: "Title" },
  { value: "updatedAt", label: "Last Updated" },
] as const

const STATUS_STYLES: Record<string, string> = {
  all: "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  DRAFT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  NEEDS_REVISION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ARCHIVED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

const STATUS_ACTIVE: Record<string, string> = {
  all: "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] border-[var(--color-accent)]",
  DRAFT: "bg-zinc-500 text-white border-zinc-500",
  SUBMITTED: "bg-blue-500 text-white border-blue-500",
  APPROVED: "bg-emerald-500 text-white border-emerald-500",
  NEEDS_REVISION: "bg-amber-500 text-white border-amber-500",
  ARCHIVED: "bg-zinc-600 text-white border-zinc-600",
}

const STRAND_STYLES: Record<string, string> = {
  CREATIVITY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ACTIVITY: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SERVICE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

const STRAND_ACTIVE: Record<string, string> = {
  CREATIVITY: "bg-purple-500 text-white border-purple-500",
  ACTIVITY: "bg-orange-500 text-white border-orange-500",
  SERVICE: "bg-sky-500 text-white border-sky-500",
}

function ExperienceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeStatus = searchParams.get("status") ?? "all"
  const activeStrands = searchParams.get("strand")?.split(",").filter(Boolean) ?? []
  const sortBy = searchParams.get("sortBy") ?? "date"

  const updateParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const toggleStrand = React.useCallback(
    (strand: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const current = params.get("strand")?.split(",").filter(Boolean) ?? []
      const next = current.includes(strand)
        ? current.filter((s) => s !== strand)
        : [...current, strand]
      if (next.length === 0) {
        params.delete("strand")
      } else {
        params.set("strand", next.join(","))
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          <button
            onClick={() => updateParam("status", null)}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              activeStatus === "all" ? STATUS_ACTIVE.all : STATUS_STYLES.all
            )}
            aria-pressed={activeStatus === "all"}
          >
            All
          </button>
          {EXPERIENCE_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => updateParam("status", activeStatus === status ? null : status)}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                activeStatus === status ? STATUS_ACTIVE[status] : STATUS_STYLES[status]
              )}
              aria-pressed={activeStatus === status}
            >
              {EXPERIENCE_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Strand filter */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by strand">
          {CAS_STRANDS.map((strand) => {
            const isActive = activeStrands.includes(strand)
            return (
              <button
                key={strand}
                onClick={() => toggleStrand(strand)}
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive ? STRAND_ACTIVE[strand] : STRAND_STYLES[strand]
                )}
                aria-pressed={isActive}
              >
                {CAS_STRAND_LABELS[strand]}
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
          <select
            value={sortBy}
            onChange={(e) => updateParam("sortBy", e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export { ExperienceFilters }
