import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EXPERIENCE_STATUS_LABELS, CAS_STRAND_LABELS, LEARNING_OUTCOMES } from "@/lib/constants"
import { formatDate, formatDuration } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PortfolioPrintButton } from "./portfolio-print-button"

export default async function PortfolioPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, image: true, createdAt: true,
      experiences: {
        where: { deletedAt: null, status: { in: ["APPROVED", "SUBMITTED"] } },
        include: {
          strands: { select: { strand: true } },
          outcomes: { select: { outcome: true } },
          evidence: { select: { id: true, filename: true, type: true } },
        },
        orderBy: { date: "asc" },
      },
    },
  })

  if (!user) redirect("/login")

  const strandCounts = { CREATIVITY: 0, ACTIVITY: 0, SERVICE: 0 }
  const outcomesSet = new Set<string>()
  for (const exp of user.experiences) {
    for (const s of exp.strands) strandCounts[s.strand as keyof typeof strandCounts]++
    for (const o of exp.outcomes) outcomesSet.add(o.outcome)
  }

  return (
    <div className="space-y-6">
      {/* Screen-only controls */}
      <div className="print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">CAS Portfolio</h1>
            <p className="text-[var(--color-text-muted)] mt-1">Print or save as PDF</p>
          </div>
          <PortfolioPrintButton />
        </div>
      </div>

      {/* Portfolio content — styled for print */}
      <div className="portfolio-content border border-[var(--color-border)] rounded-lg p-8 bg-[var(--color-surface)]">
        {/* Cover */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">CAS Portfolio</h1>
          <p className="text-xl mt-2 text-[var(--color-text-secondary)]">{user.name ?? user.email}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            International Baccalaureate — Creativity, Activity, Service
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-[var(--color-border)] pb-2">Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{user.experiences.length}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Total Experiences</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{outcomesSet.size}/7</p>
              <p className="text-sm text-[var(--color-text-muted)]">Learning Outcomes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-accent)]">
                {Object.values(strandCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">Strand Activities</p>
            </div>
          </div>
        </section>

        {/* Learning Outcomes Achieved */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-[var(--color-border)] pb-2">Learning Outcomes Achieved</h2>
          <ul className="space-y-2">
            {LEARNING_OUTCOMES.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2 text-sm">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${outcomesSet.has(outcome) ? "bg-emerald-500" : "bg-zinc-600"}`} />
                <span className={outcomesSet.has(outcome) ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>
                  {outcome} {outcomesSet.has(outcome) && "✓"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Strand Distribution */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-[var(--color-border)] pb-2">CAS Strands</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(strandCounts).map(([strand, count]) => (
              <div key={strand} className="text-center p-4 rounded-lg bg-[var(--color-surface-hover)]">
                <p className="text-lg font-bold">{count}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{CAS_STRAND_LABELS[strand as keyof typeof CAS_STRAND_LABELS]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Experiences */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-[var(--color-border)] pb-2">Experiences</h2>
          {user.experiences.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No approved or submitted experiences yet.</p>
          ) : (
            <div className="space-y-6">
              {user.experiences.map((exp) => (
                <div key={exp.id} className="p-4 rounded-lg border border-[var(--color-border)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{exp.title}</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {formatDate(exp.date)} {exp.hours != null && `· ${formatDuration(exp.hours)}`} {exp.location && `· ${exp.location}`}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                      {EXPERIENCE_STATUS_LABELS[exp.status]}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{exp.description}</p>
                  )}
                  {exp.reflection && (
                    <div className="mt-2 p-3 rounded bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-secondary)]">
                      <strong>Reflection:</strong> {exp.reflection}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exp.strands.map((s) => (
                      <span key={s.strand} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
                        {CAS_STRAND_LABELS[s.strand as keyof typeof CAS_STRAND_LABELS]}
                      </span>
                    ))}
                    {exp.outcomes.map((o) => (
                      <span key={o.outcome} className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">
                        {o.outcome.slice(0, 40)}...
                      </span>
                    ))}
                  </div>
                  {exp.evidence.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Evidence: {exp.evidence.map((e) => e.filename).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
