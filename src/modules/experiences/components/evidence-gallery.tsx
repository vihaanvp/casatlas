"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/utils"
import { Image as ImageIcon, Film, FileText, ExternalLink, X } from "lucide-react"
import type { Evidence } from "@prisma/client"

type EvidencePick = Pick<Evidence, "id" | "type" | "url" | "filename" | "mimeType" | "size" | "thumbnailUrl"> & { createdAt: Date | string }

interface EvidenceGalleryProps {
  evidence: EvidencePick[]
  className?: string
}

function getIcon(type: Evidence["type"]) {
  switch (type) {
    case "IMAGE":
      return ImageIcon
    case "VIDEO":
      return Film
    case "PDF":
      return FileText
    case "LINK":
      return ExternalLink
  }
}

function EvidenceItem({
  item,
  onOpen,
}: {
  item: EvidenceGalleryProps["evidence"][number]
  onOpen: (item: EvidenceGalleryProps["evidence"][number]) => void
}) {
  const Icon = getIcon(item.type)

  return (
    <button
      onClick={() => onOpen(item)}
      className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 rounded-lg"
      aria-label={`Open ${item.filename}`}
    >
      <Card className="overflow-hidden transition-colors hover:border-[var(--color-accent)]/50">
        {/* Preview */}
        <div className="relative aspect-square bg-[var(--color-surface-hover)] flex items-center justify-center">
          {item.type === "IMAGE" ? (
            <img
              src={item.thumbnailUrl ?? item.url}
              alt={item.filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : item.type === "VIDEO" ? (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <Film className="h-10 w-10" />
              <span className="text-xs">Video</span>
            </div>
          ) : item.type === "PDF" ? (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <FileText className="h-10 w-10" />
              <span className="text-xs">PDF</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <ExternalLink className="h-10 w-10" />
              <span className="text-xs">Link</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Icon className="h-6 w-6 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{item.filename}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(item.size)}</p>
        </div>
      </Card>
    </button>
  )
}

function Lightbox({
  item,
  onClose,
}: {
  item: EvidenceGalleryProps["evidence"][number]
  onClose: () => void
}) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-label={item.filename}
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-lg hover:bg-[var(--color-surface-hover)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        {item.type === "IMAGE" && (
          <img src={item.url} alt={item.filename} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" />
        )}
        {item.type === "VIDEO" && (
          <video src={item.url} controls className="max-h-[85vh] max-w-[90vw] rounded-lg">
            Your browser does not support video playback.
          </video>
        )}
        {item.type === "PDF" && (
          <iframe
            src={item.url}
            title={item.filename}
            className="h-[85vh] w-[90vw] rounded-lg border-0 bg-white"
          />
        )}
        {item.type === "LINK" && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg bg-[var(--color-surface)] p-6 text-[var(--color-accent)] hover:underline"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">{item.url}</span>
          </a>
        )}
      </div>
    </div>
  )
}

function EvidenceGallery({ evidence, className }: EvidenceGalleryProps) {
  const [active, setActive] = React.useState<EvidenceGalleryProps["evidence"][number] | null>(null)

  if (evidence.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] py-12 text-center">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">No evidence yet</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Upload files or add links to document your experience.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {evidence.map((item) => (
          <EvidenceItem key={item.id} item={item} onOpen={setActive} />
        ))}
      </div>

      {active && <Lightbox item={active} onClose={() => setActive(null)} />}
    </div>
  )
}

export { EvidenceGallery }
