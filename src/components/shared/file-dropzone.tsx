"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Upload, X, FileText, Image, Film } from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { uploadConfig } from "@/config/upload"

interface FileDropzoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
  className?: string
  maxFiles?: number
}

const ALL_ACCEPTED = {
  "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
}

function FileDropzone({ onFiles, disabled, className, maxFiles = 10 }: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFiles,
    accept: ALL_ACCEPTED,
    maxSize: uploadConfig.maxFileSize,
    maxFiles,
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed",
        "border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center transition-colors",
        "hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]",
        isDragActive && "border-[var(--color-accent)] bg-[var(--color-accent-muted)]",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className={cn("mb-3 h-8 w-8", isDragActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]")} />
      {isDragActive ? (
        <p className="text-sm font-medium text-[var(--color-accent)]">Drop files here</p>
      ) : (
        <>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Drag & drop files here, or click to browse
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Images, videos, PDFs up to {formatFileSize(uploadConfig.maxFileSize)}
          </p>
        </>
      )}
    </div>
  )
}

interface FilePreviewItemProps {
  file: File
  onRemove: () => void
  progress?: number
  error?: string
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image
  if (type.startsWith("video/")) return Film
  return FileText
}

function FilePreviewItem({ file, onRemove, progress, error }: FilePreviewItemProps) {
  const Icon = getFileIcon(file.type)
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreview(null)
  }, [file])

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3",
      error && "border-[var(--color-destructive)]"
    )}>
      {preview ? (
        <img src={preview} alt="" className="h-10 w-10 rounded object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--color-surface-hover)]">
          <Icon className="h-5 w-5 text-[var(--color-text-muted)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{file.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.size)}</p>
        {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
        {progress !== undefined && progress < 100 && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export { FileDropzone, FilePreviewItem }
