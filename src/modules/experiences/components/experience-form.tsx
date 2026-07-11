"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { FileDropzone, FilePreviewItem } from "@/components/shared/file-dropzone"
import { useAutosave } from "@/hooks/use-autosave"
import { useUpload } from "@/hooks/use-upload"
import { saveExperienceDraft, createExperience, updateExperience } from "../experience.actions"
import { removeEvidence } from "@/modules/uploads/upload.actions"
import { LEARNING_OUTCOMES, CAS_STRANDS, CAS_STRAND_LABELS } from "@/lib/constants"
import { experienceBaseSchema } from "../experience.types"
import type { Experience, Evidence } from "@prisma/client"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CircleCheckBig,
  Loader2,
  Clock,
  FileUp,
  Trash2,
  RotateCcw,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────

interface ExperienceFormProps {
  experience?: Experience & { outcomes: { outcome: string }[]; strands: { strand: string }[]; evidence: Evidence[] }
  mode: "create" | "edit"
}

type FormData = {
  title: string
  date: string
  description: string
  reflection: string
  supervisor: string
  hours: string
  location: string
  notes: string
  isGroup: boolean
  strands: string[]
  outcomes: string[]
}

const STEPS = ["Basics", "Details", "Evidence"]
const INITIAL_DATA: FormData = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  reflection: "",
  supervisor: "",
  hours: "",
  location: "",
  notes: "",
  isGroup: false,
  strands: [],
  outcomes: [],
}

// ─── Save Status Indicator ────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error"

function SaveStatusIndicator({ status, lastSaved }: { status: SaveStatus; lastSaved: Date | null }) {
  const timeAgo = lastSaved ? getTimeAgo(lastSaved) : null

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-[var(--color-accent)]" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CircleCheckBig className="h-3 w-3 text-[var(--color-accent)]" />
          <span>{timeAgo ? `Last edited ${timeAgo}` : "Saved"}</span>
        </>
      )}
      {status === "error" && (
        <>
          <RotateCcw className="h-3 w-3 text-[var(--color-destructive)]" />
          <span className="text-[var(--color-destructive)]">Save failed</span>
        </>
      )}
      {status === "idle" && lastSaved && (
        <>
          <Clock className="h-3 w-3" />
          <span>Last edited {timeAgo}</span>
        </>
      )}
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 10) return "just now"
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

// ─── Main Form Component ──────────────────────────────────

function ExperienceForm({ experience, mode }: ExperienceFormProps) {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [draftId, setDraftId] = React.useState<string | undefined>(experience?.id)

  const [data, setData] = React.useState<FormData>(() => {
    if (experience) {
      return {
        title: experience.title,
        date: experience.date.toISOString().split("T")[0],
        description: experience.description ?? "",
        reflection: experience.reflection ?? "",
        supervisor: experience.supervisor ?? "",
        hours: experience.hours?.toString() ?? "",
        location: experience.location ?? "",
        notes: experience.notes ?? "",
        isGroup: experience.isGroup,
        strands: experience.strands.map((s) => s.strand),
        outcomes: experience.outcomes.map((o) => o.outcome),
      }
    }
    return INITIAL_DATA
  })

  const update = React.useCallback((patch: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }, [])

  // ─── Autosave ─────────────────────────────────────────

  const doAutosave = React.useCallback(async (formData: FormData) => {
    setSaving("saving")
    const result = await saveExperienceDraft({
      id: draftId,
      title: formData.title || undefined,
      date: formData.date || undefined,
      description: formData.description || undefined,
      reflection: formData.reflection || undefined,
      supervisor: formData.supervisor || undefined,
      hours: formData.hours ? Number(formData.hours) : undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      isGroup: formData.isGroup,
      strands: formData.strands as ("CREATIVITY" | "ACTIVITY" | "SERVICE")[],
      outcomes: formData.outcomes,
    })

    if (result.success && result.data) {
      setDraftId(result.data.id)
      setSaving("saved")
      setLastSaved(new Date())
    } else {
      setSaving("error")
    }
  }, [draftId])

  const { autosave, saveNow } = useAutosave(doAutosave, 2000)

  // Cmd+S keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveNow()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [saveNow])

  // Trigger autosave on data change
  React.useEffect(() => {
    if (data.title || data.description || data.reflection) {
      autosave(data)
    }
  }, [data, autosave])

  // ─── Submit ───────────────────────────────────────────

  const handleSubmit = async () => {
    // Validate
    const parsed = experienceBaseSchema.safeParse({
      title: data.title,
      date: data.date,
      description: data.description || undefined,
      reflection: data.reflection || undefined,
      supervisor: data.supervisor || undefined,
      hours: data.hours ? Number(data.hours) : undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
      isGroup: data.isGroup,
      strands: data.strands,
      outcomes: data.outcomes,
    })

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
      toast.error(firstError || "Please fix the errors in the form")
      return
    }

    setSaving("saving")
    let result
    if (mode === "edit" && experience) {
      result = await updateExperience(experience.id, parsed.data)
    } else {
      result = await createExperience(parsed.data)
    }

    if (result.success) {
      toast.success(mode === "edit" ? "Experience updated" : "Experience created")
      router.push(`/experiences/${result.data.id}`)
    } else {
      toast.error(result.error)
      setSaving("error")
    }
  }

  // ─── Step validation ──────────────────────────────────

  const canProceed = React.useMemo(() => {
    if (step === 0) return data.title.trim().length > 0 && data.date.length > 0
    return true
  }, [step, data])

  return (
    <div className="space-y-6">
      {/* Step indicator + save status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                  i === step
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                    : i < step
                    ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] cursor-pointer hover:bg-[var(--color-accent)]/20"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] cursor-not-allowed"
                )}
                disabled={i > step}
              >
                {i < step ? <CircleCheckBig className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px w-6 sm:w-10", i < step ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]")} />
              )}
            </React.Fragment>
          ))}
        </div>
        <SaveStatusIndicator status={saving} lastSaved={lastSaved} />
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Basic Information</h2>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-[var(--color-text-primary)]">
                  Title <span className="text-[var(--color-destructive)]">*</span>
                </Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="e.g., Beach Cleanup Initiative"
                  className="bg-[var(--color-background)]"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-[var(--color-text-primary)]">
                  Date <span className="text-[var(--color-destructive)]">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={data.date}
                  onChange={(e) => update({ date: e.target.value })}
                  className="bg-[var(--color-background)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[var(--color-text-primary)]">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Brief description of the experience"
                  className="bg-[var(--color-background)]"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Details & Reflection</h2>

              <div className="space-y-2">
                <Label className="text-[var(--color-text-primary)]">Reflection</Label>
                <RichTextEditor
                  value={data.reflection}
                  onChange={(v) => update({ reflection: v })}
                  placeholder="Write about what you learned, challenges faced, and how you grew..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supervisor" className="text-[var(--color-text-primary)]">Supervisor</Label>
                  <Input
                    id="supervisor"
                    value={data.supervisor}
                    onChange={(e) => update({ supervisor: e.target.value })}
                    placeholder="e.g., Ms. Johnson"
                    className="bg-[var(--color-background)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-[var(--color-text-primary)]">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.5"
                    value={data.hours}
                    onChange={(e) => update({ hours: e.target.value })}
                    placeholder="e.g., 4.5"
                    className="bg-[var(--color-background)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[var(--color-text-primary)]">Location</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => update({ location: e.target.value })}
                    placeholder="e.g., City Beach"
                    className="bg-[var(--color-background)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[var(--color-text-primary)]">Notes</Label>
                  <Input
                    id="notes"
                    value={data.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    placeholder="Any additional notes"
                    className="bg-[var(--color-background)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="isGroup"
                  checked={data.isGroup}
                  onCheckedChange={(checked) => update({ isGroup: checked })}
                />
                <Label htmlFor="isGroup" className="text-[var(--color-text-primary)]">Group Project</Label>
              </div>

              {/* CAS Strands */}
              <div className="space-y-3">
                <Label className="text-[var(--color-text-primary)]">CAS Strands</Label>
                <div className="flex flex-wrap gap-3">
                  {CAS_STRANDS.map((strand) => (
                    <label
                      key={strand}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        data.strands.includes(strand)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={data.strands.includes(strand)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update({ strands: [...data.strands, strand] })
                          } else {
                            update({ strands: data.strands.filter((s) => s !== strand) })
                          }
                        }}
                      />
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        data.strands.includes(strand)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                          : "border-[var(--color-border)]"
                      )}>
                        {data.strands.includes(strand) && <CircleCheckBig className="h-3 w-3 text-white" />}
                      </div>
                      {CAS_STRAND_LABELS[strand]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-3">
                <Label className="text-[var(--color-text-primary)]">Learning Outcomes</Label>
                <div className="space-y-2">
                  {LEARNING_OUTCOMES.map((outcome) => (
                    <label
                      key={outcome}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                        data.outcomes.includes(outcome)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text-primary)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={data.outcomes.includes(outcome)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update({ outcomes: [...data.outcomes, outcome] })
                          } else {
                            update({ outcomes: data.outcomes.filter((o) => o !== outcome) })
                          }
                        }}
                      />
                      <div className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        data.outcomes.includes(outcome)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                          : "border-[var(--color-border)]"
                      )}>
                        {data.outcomes.includes(outcome) && <CircleCheckBig className="h-3 w-3 text-white" />}
                      </div>
                      <span className="leading-tight">{outcome}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <EvidenceStep
              experienceId={draftId}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canProceed}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving === "saving"}>
              {mode === "edit" ? (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  Create Experience
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Evidence Step ────────────────────────────────────────

function EvidenceStep({
  experienceId,
}: {
  experienceId: string | undefined
}) {
  const { files, upload, retry, remove } = useUpload({
    experienceId: experienceId || "",
  })

  const [existingEvidence, setExistingEvidence] = React.useState<
    { id: string; url: string; filename: string; type: string; size: number }[]
  >([])
  const [loadingEvidence, setLoadingEvidence] = React.useState(true)

  // Fetch existing evidence if editing
  React.useEffect(() => {
    if (!experienceId) {
      setLoadingEvidence(false)
      return
    }
    // Fetch evidence from the experience
    fetch(`/api/experiences/${experienceId}/evidence`)
      .then((r) => r.ok ? r.json() : [])
      .then(setExistingEvidence)
      .catch(() => {})
      .finally(() => setLoadingEvidence(false))
  }, [experienceId])

  const handleRemoveExisting = async (id: string) => {
    const result = await removeEvidence(id)
    if (result.success) {
      setExistingEvidence((prev) => prev.filter((e) => e.id !== id))
      toast.success("Evidence removed")
    } else {
      toast.error(result.error || "Failed to remove evidence")
    }
  }

  if (!experienceId) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Evidence</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Save your experience first, then upload evidence.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Evidence</h2>

      <FileDropzone
        onFiles={(newFiles) => upload(newFiles)}
        disabled={!experienceId}
      />

      {/* Upload queue */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">UPLOADING</p>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <FilePreviewItem
                    file={f.file}
                    onRemove={() => remove(f.id)}
                    progress={f.status === "uploading" ? f.progress : undefined}
                    error={f.error}
                  />
                </div>
                {f.status === "error" && (
                  <Button variant="outline" size="sm" onClick={() => retry(f.id)}>
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing evidence */}
      {existingEvidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">UPLOADED</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {existingEvidence.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-[var(--color-text-primary)]">{ev.filename}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{ev.type}</p>
                </div>
                <button
                  onClick={() => handleRemoveExisting(ev.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingEvidence && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
        </div>
      )}
    </div>
  )
}

export { ExperienceForm }
