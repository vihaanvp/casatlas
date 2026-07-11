import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { EXPERIENCE_STATUS_LABELS, EXPERIENCE_STATUS_COLORS, CAS_STRAND_LABELS } from "@/lib/constants"
import type { ExperienceStatus } from "@prisma/client"

type Strand = { strand: string }

interface TimelineExperience {
  id: string
  title: string
  date: Date | string
  status: ExperienceStatus
  strands: Strand[]
}

interface ExperienceTimelineProps {
  experiences: TimelineExperience[]
  className?: string
}

const STRAND_COLORS: Record<string, string> = {
  CREATIVITY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ACTIVITY: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SERVICE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-zinc-400",
  SUBMITTED: "bg-blue-400",
  APPROVED: "bg-emerald-400",
  NEEDS_REVISION: "bg-amber-400",
  ARCHIVED: "bg-zinc-500",
}

function ExperienceTimeline({ experiences, className }: ExperienceTimelineProps) {
  const sorted = [...experiences].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center">
        <p className="text-lg font-medium text-[var(--color-text-primary)]">No experiences yet</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your timeline will appear here as you add experiences.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} role="list" aria-label="Experience timeline">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]" aria-hidden="true" />

      <div className="space-y-0">
        {sorted.map((exp) => (
          <div key={exp.id} className="relative flex gap-4 py-4" role="listitem">
            {/* Dot */}
            <div className="relative z-10 mt-1.5" aria-hidden="true">
              <div className={cn("h-[10px] w-[10px] rounded-full ring-2 ring-[var(--color-surface)]", STATUS_DOT[exp.status] ?? "bg-zinc-400")} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <time dateTime={new Date(exp.date).toISOString()}>
                  {formatDate(exp.date)}
                </time>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    EXPERIENCE_STATUS_COLORS[exp.status]
                  )}
                >
                  {EXPERIENCE_STATUS_LABELS[exp.status]}
                </span>
              </div>

              <Link
                href={`/experiences/${exp.id}`}
                className="mt-1 block text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
              >
                {exp.title}
              </Link>

              {exp.strands.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {exp.strands.map((s) => (
                    <span
                      key={s.strand}
                      className={cn(
                        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                        STRAND_COLORS[s.strand] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}
                    >
                      {CAS_STRAND_LABELS[s.strand as keyof typeof CAS_STRAND_LABELS] ?? s.strand}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ExperienceTimeline }
