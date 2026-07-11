import { Suspense } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LoadingPage } from "@/components/shared/loading-spinner"
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton"
import { getExperienceStats, getStrandProgress, getOutcomeProgress, getRecentDrafts, getRecentActivity } from "@/modules/experiences/experience.actions"
import {
  BookOpen,
  Clock,
  CircleCheck,
  Archive,
  PenLine,
  Plus,
  ArrowRight,
  FileText,
  Search,
  Activity,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CAS_STRAND_LABELS } from "@/lib/constants"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | CASAtlas",
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  updated: <PenLine className="h-3.5 w-3.5" />,
  revision: <FileText className="h-3.5 w-3.5" />,
}

const ACTIVITY_LABELS: Record<string, string> = {
  created: "created",
  updated: "updated",
  revision: "edited",
}

const STRAND_COLORS: Record<string, string> = {
  CREATIVITY: "bg-purple-400",
  ACTIVITY: "bg-orange-400",
  SERVICE: "bg-sky-400",
}

// ─── Overview Cards ──────────────────────────────────────

async function StatsCards() {
  const stats = await getExperienceStats()
  if (!stats) return null

  const cards = [
    { label: "Total Experiences", value: stats.total, icon: BookOpen, detail: `${stats.totalHours} hours logged` },
    { label: "Drafts", value: stats.drafts, icon: PenLine, detail: "In progress" },
    { label: "Submitted", value: stats.submitted, icon: Clock, detail: "Awaiting review" },
    { label: "Approved", value: stats.approved, icon: CircleCheck, detail: "Completed" },
    { label: "Archived", value: stats.archived, icon: Archive, detail: "Archived" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
              {card.label}
            </CardTitle>
            <card.icon className="h-4 w-4 text-[var(--color-text-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{card.value}</div>
            <p className="text-xs text-[var(--color-text-muted)]">{card.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Progress Section ────────────────────────────────────

async function ProgressSection() {
  const [strandProgress, outcomeProgress] = await Promise.all([
    getStrandProgress(),
    getOutcomeProgress(),
  ])

  if (!strandProgress) return null

  const strands = [
    { key: "CREATIVITY" as const, count: strandProgress.CREATIVITY },
    { key: "ACTIVITY" as const, count: strandProgress.ACTIVITY },
    { key: "SERVICE" as const, count: strandProgress.SERVICE },
  ]

  // Ponytail: rough target of 5 experiences per strand — adjust if spec says otherwise
  const maxStrand = Math.max(...strands.map((s) => s.count), 1)
  const targetPerStrand = Math.max(maxStrand, 5)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Strand Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
            Strand Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strands.map((s) => (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-primary)]">
                  {CAS_STRAND_LABELS[s.key]}
                </span>
                <span className="text-[var(--color-text-muted)]">
                  {s.count} experience{s.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="relative">
                <div className="h-2 rounded-full bg-[var(--color-surface-hover)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${STRAND_COLORS[s.key]}`}
                    style={{ width: `${Math.min((s.count / targetPerStrand) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
            Learning Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-primary)]">Completed</span>
            <span className="text-sm font-medium text-[var(--color-accent)]">
              {outcomeProgress?.completed ?? 0} / {outcomeProgress?.total ?? 7}
            </span>
          </div>
          <Progress value={outcomeProgress?.completed ?? 0} max={outcomeProgress?.total ?? 7} />
          <p className="text-xs text-[var(--color-text-muted)]">
            {outcomeProgress?.completed === 0
              ? "Submit experiences with learning outcomes to track progress"
              : `${outcomeProgress?.total ?? 7 - (outcomeProgress?.completed ?? 0)} outcomes remaining`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Continue Working ────────────────────────────────────

async function ContinueWorking() {
  const drafts = await getRecentDrafts(5)

  if (drafts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
            Continue Working
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-text-muted)]">
            No drafts in progress.{" "}
            <Link href="/experiences/new" className="text-[var(--color-accent)] hover:underline">
              Start a new experience
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
          Continue Working
        </CardTitle>
        <Link href="/experiences?status=DRAFT" className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {drafts.map((draft) => (
          <Link
            key={draft.id}
            href={`/experiences/${draft.id}/edit`}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {draft.title}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Edited {formatDate(draft.updatedAt)}
              </p>
            </div>
            <div className="flex gap-1 ml-3">
              {draft.strands.map((s) => (
                <span
                  key={s.strand}
                  className={`h-2 w-2 rounded-full ${STRAND_COLORS[s.strand] ?? "bg-zinc-400"}`}
                  title={CAS_STRAND_LABELS[s.strand as keyof typeof CAS_STRAND_LABELS] ?? s.strand}
                />
              ))}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Recent Activity ─────────────────────────────────────

async function RecentActivity() {
  const activity = await getRecentActivity(8)

  if (activity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your activity will appear here as you work on experiences.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
                {ACTIVITY_ICONS[item.type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <Link
                    href={`/experiences/${item.experienceId}`}
                    className="font-medium hover:text-[var(--color-accent)] transition-colors"
                  >
                    {item.experienceTitle}
                  </Link>{" "}
                  <span className="text-[var(--color-text-muted)]">
                    {ACTIVITY_LABELS[item.type]}
                  </span>
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatDate(item.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Quick Actions ───────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: "New Experience", href: "/experiences/new", icon: Plus },
    { label: "Search", href: "/experiences", icon: Search },
    { label: "Timeline", href: "/experiences?view=timeline", icon: Activity },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant="outline" size="sm" className="gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome to your CAS journey"
        action={
          <Link href="/experiences/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Experience
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<LoadingPage />}>
            <ProgressSection />
          </Suspense>

          <Suspense fallback={<LoadingPage />}>
            <ContinueWorking />
          </Suspense>
        </div>

        <div className="space-y-6">
          <QuickActions />

          <Suspense fallback={<LoadingPage />}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
