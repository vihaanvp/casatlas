"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

function insertMarkdown(textarea: HTMLTextAreaElement, prefix: string, suffix: string, onChange: (v: string) => void, currentValue: string) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = currentValue.substring(start, end)
  const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`
  const newValue = currentValue.substring(0, start) + replacement + currentValue.substring(end)
  onChange(newValue)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(
      selected ? start : start + prefix.length,
      selected ? start + replacement.length : start + prefix.length + 4
    )
  })
}

function insertBlockMarkdown(textarea: HTMLTextAreaElement, prefix: string, onChange: (v: string) => void, currentValue: string) {
  const start = textarea.selectionStart
  const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1
  const newValue = currentValue.substring(0, lineStart) + prefix + currentValue.substring(lineStart)
  onChange(newValue)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length)
  })
}

function renderMarkdownPreview(md: string): string {
  if (!md) return '<p style="color:var(--color-text-muted)">Nothing to preview</p>'

  // Sanitize URLs to prevent javascript: and data: XSS
  function sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
        return url
      }
    } catch {
      // Not a valid URL — block it
    }
    return "#"
  }

  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g, "<u>$1</u>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:8px;align-items:center"><input type="checkbox" disabled /><span>$1</span></div>')
    .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:8px;align-items:center"><input type="checkbox" checked disabled /><span>$1</span></div>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => `<a href="${sanitizeUrl(url)}">${text}</a>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />")
  if (!html.startsWith("<h") && !html.startsWith("<pre") && !html.startsWith("<blockquote")) {
    html = `<p>${html}</p>`
  }
  return html
}

const TOOLBAR_BUTTONS = [
  { label: "Bold", prefix: "**", suffix: "**", icon: "B", block: false, className: "font-bold" },
  { label: "Italic", prefix: "_", suffix: "_", icon: "I", block: false, className: "italic" },
  { label: "Underline", prefix: "<u>", suffix: "</u>", icon: "U", block: false, className: "underline" },
  { label: "Heading", prefix: "## ", suffix: "", icon: "H", block: true, className: "font-semibold" },
  { label: "Quote", prefix: "> ", suffix: "", icon: "\u201C", block: true, className: "" },
  { label: "Bullet List", prefix: "- ", suffix: "", icon: "\u2022", block: true, className: "" },
  { label: "Numbered List", prefix: "1. ", suffix: "", icon: "1.", block: true, className: "" },
  { label: "Checklist", prefix: "- [ ] ", suffix: "", icon: "\u2610", block: true, className: "" },
  { label: "Code", prefix: "`", suffix: "`", icon: "</>", block: false, className: "font-mono text-[10px]" },
  { label: "Link", prefix: "[", suffix: "](url)", icon: "\u2197", block: false, className: "" },
  { label: "Table", prefix: "| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n", suffix: "", icon: "\u229E", block: true, className: "" },
  { label: "Divider", prefix: "\n---\n", suffix: "", icon: "\u2014", block: true, className: "" },
]

function RichTextEditor({ value, onChange, placeholder = "Write your reflection...", className, minHeight = 200 }: RichTextEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = React.useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      onChange(value.substring(0, start) + "  " + value.substring(end))
      requestAnimationFrame(() => { e.currentTarget.setSelectionRange(start + 2, start + 2) })
    }
  }

  return (
    <div className={cn("rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] px-2 py-1.5">
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => {
              const ta = textareaRef.current
              if (!ta) return
              if (btn.block) { insertBlockMarkdown(ta, btn.prefix, onChange, value) } else { insertMarkdown(ta, btn.prefix, btn.suffix, onChange, value) }
            }}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded text-xs text-[var(--color-text-secondary)]",
              "hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]",
              btn.className
            )}
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-[var(--color-text-secondary)]",
            "hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            "transition-colors",
            showPreview && "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
          )}
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>
      {showPreview ? (
        <div
          className="p-4 text-sm text-[var(--color-text-primary)] leading-relaxed"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full resize-y bg-transparent p-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          style={{ minHeight }}
        />
      )}
    </div>
  )
}

export { RichTextEditor }
