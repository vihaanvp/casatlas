"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, formatDuration } from "@/lib/utils"
import { EvidenceGallery } from "./evidence-gallery"
import { submitExperience, deleteExperience } from "../experience.actions"
import { approveExperience, requestRevision } from "@/modules/teacher/teacher.actions"
import { CommentSection, type CommentData } from "@/components/shared/comment-section"
import {
  EXPERIENCE_STATUS_LABELS,
  EXPERIENCE_STATUS_COLORS,
  CAS_STRAND_LABELS,
} from "@/lib/constants"
import type { ExperienceStatus } from "@prisma/client"
import {
  Pencil,
  Trash2,
  Send,
  Clock,
  MapPin,
  Users,
  User,
  Timer,
  ArrowLeft,
  History,
  Check,
  X,
  MessageSquare,
} from "lucide-react"

type Strand = { strand: string }
type Outcome = { outcome: string }
type EvidenceItem = {
  id: string
  type: "IMAGE" | "VIDEO" | "PDF" | "LINK"
  url: string
  filename: string
  mimeType: string
  size: number
  thumbnailUrl: string | null
  createdAt: Date | string
}
type Revision = {
  id: string
  createdAt: Date | string
  snapshot: unknown
}

interface ExperienceDetailProps {
  experience: {
    id: string
    title: string
    date: Date | string
    description: string | null
    reflection: string | null
    supervisor: string | null
    hours: number | null
    location: string | null
    notes: string | null
    isGroup: boolean
    status: ExperienceStatus
    createdAt: Date | string
    updatedAt: Date | string
    strands: Strand[]
    outcomes: Outcome[]
    evidence: EvidenceItem[]
    revisions: Revision[]
  }
  comments?: CommentData[]
  isReviewer?: boolean
  currentUserId?: string
}

const STRAND_COLORS: Record<string, string> = {
  CREATIVITY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ACTIVITY: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SERVICE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

function MarkdownContent({ content }: { content: string }) {
  // ponytail: simple paragraph-based rendering. Full markdown needs a lib; add when needed.
  return (
    <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)]">
      {content.split("\n\n").map((block, i) => (
        <p key={i} className="mb-3 leading-relaxed">
          {block}
        </p>
      ))}
    </div>
  )
}

function ExperienceDetail({ experience, comments = [], isReviewer = false, currentUserId }: ExperienceDetailProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [approving, setApproving] = React.useState(false)
  const [revisionReason, setRevisionReason] = React.useState("")
  const [showRevisionForm, setShowRevisionForm] = React.useState(false)
  const [requestingRevision, setRequestingRevision] = React.useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    const result = await submitExperience(experience.id)
    setSubmitting(false)

    if (result.success) {
      toast.success("Experience submitted for review")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this experience? This cannot be undone.")) return
    setDeleting(true)
    const result = await deleteExperience(experience.id)
    setDeleting(false)

    if (result.success) {
      toast.success("Experience deleted")
      router.push("/experiences")
    } else {
      toast.error(result.error)
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      await approveExperience(experience.id)
      toast.success("Experience approved")
      router.refresh()
    } catch {
      toast.error("Failed to approve")
    } finally {
      setApproving(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) return
    setRequestingRevision(true)
    try {
      await requestRevision(experience.id, revisionReason.trim())
      toast.success("Revision requested")
      setShowRevisionForm(false)
      setRevisionReason("")
      router.refresh()
    } catch {
      toast.error("Failed to request revision")
    } finally {
      setRequestingRevision(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/experiences"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to experiences
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {experience.title}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                EXPERIENCE_STATUS_COLORS[experience.status]
              )}
            >
              {EXPERIENCE_STATUS_LABELS[experience.status]}
            </span>
          </div>
          <time className="block text-sm text-[var(--color-text-secondary)]" dateTime={new Date(experience.date).toISOString()}>
            {formatDate(experience.date)}
          </time>
        </div>

        <div className="flex items-center gap-2">
          {/* Student actions */}
          {(experience.status === "DRAFT" || experience.status === "NEEDS_REVISION") && (
            <>
              <Link href={`/experiences/${experience.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </>
          )}

          {/* Teacher review actions */}
          {isReviewer && experience.status === "SUBMITTED" && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={approving} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowRevisionForm(!showRevisionForm)}>
                <X className="h-4 w-4" />
                Request Revision
              </Button>
            </>
          )}

          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Revision request form */}
      {showRevisionForm && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-400 mb-2">Reason for revision:</p>
            <Textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Explain what needs to be changed..."
              className="min-h-[80px] bg-[var(--color-surface)]"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowRevisionForm(false)}>Cancel</Button>
              <Button size="sm" variant="outline" onClick={handleRequestRevision} disabled={!revisionReason.trim() || requestingRevision}>
                Send Revision Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Description */}
          {experience.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {experience.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Strands */}
          {experience.strands.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CAS Strands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {experience.strands.map((s) => (
                    <span
                      key={s.strand}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium",
                        STRAND_COLORS[s.strand] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}
                    >
                      {CAS_STRAND_LABELS[s.strand as keyof typeof CAS_STRAND_LABELS] ?? s.strand}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Outcomes */}
          {experience.outcomes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Learning Outcomes ({experience.outcomes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {experience.outcomes.map((o) => (
                    <li key={o.outcome} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      {o.outcome}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Reflection */}
          {experience.reflection && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={experience.reflection} />
              </CardContent>
            </Card>
          )}

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Evidence ({experience.evidence.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EvidenceGallery evidence={experience.evidence} />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection
                experienceId={experience.id}
                initialComments={comments}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {experience.hours != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)]">Duration</span>
                  <span className="ml-auto font-medium text-[var(--color-text-primary)]">
                    {formatDuration(experience.hours)}
                  </span>
                </div>
              )}
              {experience.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)]">Location</span>
                  <span className="ml-auto text-right font-medium text-[var(--color-text-primary)]">
                    {experience.location}
                  </span>
                </div>
              )}
              {experience.supervisor && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)]">Supervisor</span>
                  <span className="ml-auto font-medium text-[var(--color-text-primary)]">
                    {experience.supervisor}
                  </span>
                </div>
              )}
              {experience.isGroup && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)]">Group Project</span>
                </div>
              )}
              {experience.notes && (
                <div className="mt-2 rounded-md bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-secondary)]">
                  {experience.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revision history */}
          {experience.revisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Recent Revisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {experience.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"
                    >
                      <Clock className="h-3 w-3" />
                      <time dateTime={new Date(rev.createdAt).toISOString()}>
                        {formatDate(rev.createdAt)}
                      </time>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export { ExperienceDetail }
