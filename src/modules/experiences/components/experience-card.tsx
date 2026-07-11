import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { formatDateShort } from "@/lib/utils"
import { EXPERIENCE_STATUS_LABELS, EXPERIENCE_STATUS_COLORS, CAS_STRAND_LABELS } from "@/lib/constants"
import type { ExperienceStatus } from "@prisma/client"
import { Calendar, BookOpen, Paperclip, Clock } from "lucide-react"

type Strand = { strand: string }
type Outcome = { outcome: string }

interface ExperienceCardProps {
  experience: {
    id: string
    title: string
    date: Date | string
    status: ExperienceStatus
    updatedAt: Date | string
    strands: Strand[]
    outcomes: Outcome[]
    evidenceCount: number
  }
  className?: string
}

function getTimeAgo(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth}mo ago`
}

const STRAND_COLORS: Record<string, string> = {
  CREATIVITY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ACTIVITY: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SERVICE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

function ExperienceCard({ experience, className }: ExperienceCardProps) {
  return (
    <Link href={`/experiences/${experience.id}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 rounded-lg">
      <Card
        className={cn(
          "transition-colors hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-hover)]",
          className
        )}
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
              {experience.title}
            </h3>
            <span
              className={cn(
                "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                EXPERIENCE_STATUS_COLORS[experience.status]
              )}
            >
              {EXPERIENCE_STATUS_LABELS[experience.status]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={new Date(experience.date).toISOString()}>
              {formatDateShort(experience.date)}
            </time>
          </div>

          {experience.strands.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {experience.strands.map((s) => (
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
          )}

          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {experience.outcomes.length} outcome{experience.outcomes.length !== 1 && "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {experience.evidenceCount} evidence
            </span>
            <span className="inline-flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {getTimeAgo(experience.updatedAt)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export { ExperienceCard }
