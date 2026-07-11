"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, ArrowRight, User, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { EXPERIENCE_STATUS_LABELS, EXPERIENCE_STATUS_COLORS, CAS_STRAND_LABELS } from "@/lib/constants"
import type { ExperienceStatus, Strand } from "@prisma/client"

type ExperienceResult = {
  id: string
  title: string
  status: ExperienceStatus
  strands: { strand: Strand }[]
  date: string
}

type UserResult = {
  id: string
  name: string | null
  email: string | null
  role: string
}

type CommentResult = {
  id: string
  content: string
  experienceId: string
  experience: { title: string }
}

interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [experiences, setExperiences] = React.useState<ExperienceResult[]>([])
  const [users, setUsers] = React.useState<UserResult[]>([])
  const [comments, setComments] = React.useState<CommentResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Combine all results for navigation
  const allResults = React.useMemo(() => {
    const items: Array<{ type: "experience" | "user" | "comment"; id: string; href: string }> = []
    for (const e of experiences) items.push({ type: "experience", id: e.id, href: `/experiences/${e.id}` })
    for (const u of users) items.push({ type: "user", id: u.id, href: `/settings/profile` })
    for (const c of comments) items.push({ type: "comment", id: c.id, href: `/experiences/${c.experienceId}` })
    return items
  }, [experiences, users, comments])

  // Focus input on open
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setExperiences([])
      setUsers([])
      setComments([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search with debounce
  const handleSearch = React.useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setExperiences([])
      setUsers([])
      setComments([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
        if (res.ok) {
          const data = await res.json()
          setExperiences(data.experiences ?? [])
          setUsers(data.users ?? [])
          setComments(data.comments ?? [])
          setSelectedIndex(0)
        }
      } catch {
        // ponytail: silent fail — dialog stays open, user retries
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [])

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && allResults[selectedIndex]) {
        router.push(allResults[selectedIndex].href)
        onOpenChange(false)
      } else if (e.key === "Escape") {
        onOpenChange(false)
      }
    },
    [allResults, selectedIndex, router, onOpenChange]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search experiences, users, comments..."
              className="h-12 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-1.5 font-mono text-[10px] text-[var(--color-text-muted)]">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {loading && (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                Searching...
              </div>
            )}

            {!loading && query && allResults.length === 0 && (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && allResults.length > 0 && (
              <div className="space-y-1">
                {/* Experiences */}
                {experiences.length > 0 && (
                  <>
                    <p className="px-3 py-1 text-[10px] font-medium uppercase text-[var(--color-text-muted)]">Experiences</p>
                    {experiences.map((result) => {
                      const idx = allResults.findIndex((r) => r.type === "experience" && r.id === result.id)
                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            router.push(`/experiences/${result.id}`)
                            onOpenChange(false)
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            idx === selectedIndex
                              ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          )}
                        >
                          <FileText className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", EXPERIENCE_STATUS_COLORS[result.status])}>
                                {EXPERIENCE_STATUS_LABELS[result.status]}
                              </span>
                              {result.strands.map((s) => (
                                <span key={s.strand} className="text-[10px] text-[var(--color-text-muted)]">
                                  {CAS_STRAND_LABELS[s.strand]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Users */}
                {users.length > 0 && (
                  <>
                    <p className="px-3 py-1 text-[10px] font-medium uppercase text-[var(--color-text-muted)] mt-2">Users</p>
                    {users.map((user) => {
                      const idx = allResults.findIndex((r) => r.type === "user" && r.id === user.id)
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            router.push(`/settings/profile`)
                            onOpenChange(false)
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            idx === selectedIndex
                              ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          )}
                        >
                          <User className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{user.name ?? "Unnamed"}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">{user.email} · {user.role}</p>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Comments */}
                {comments.length > 0 && (
                  <>
                    <p className="px-3 py-1 text-[10px] font-medium uppercase text-[var(--color-text-muted)] mt-2">Comments</p>
                    {comments.map((comment) => {
                      const idx = allResults.findIndex((r) => r.type === "comment" && r.id === comment.id)
                      return (
                        <button
                          key={comment.id}
                          onClick={() => {
                            router.push(`/experiences/${comment.experienceId}`)
                            onOpenChange(false)
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            idx === selectedIndex
                              ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{comment.content.slice(0, 80)}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">on {comment.experience.title}</p>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {!loading && !query && (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                Type to search experiences, users, comments
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-1 font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-1 font-mono">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-1 font-mono">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Keyboard shortcut hook + global provider ────────────

function useCommandK() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return { open, setOpen }
}

export { CommandDialog, useCommandK }
