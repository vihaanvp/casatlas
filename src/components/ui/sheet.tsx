"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
})

function Sheet({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const handleOpenChange = onOpenChange ?? setInternalOpen

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(SheetContext)
  return (
    <button onClick={() => ctx.onOpenChange(true)} {...props}>
      {children}
    </button>
  )
}

function SheetContent({ children, side = "right", className, ...props }: React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" | "top" | "bottom" }) {
  const ctx = React.useContext(SheetContext)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Focus trap
  React.useEffect(() => {
    if (!ctx.open) return
    const content = contentRef.current
    if (!content) return

    const focusable = content.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        ctx.onOpenChange(false)
        return
      }
      if (e.key !== "Tab") return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    first?.focus()
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [ctx])

  if (!ctx.open) return null

  const sideClasses = {
    left: "fixed inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
    right: "fixed inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
    top: "fixed inset-x-0 top-0 border-b",
    bottom: "fixed inset-x-0 bottom-0 border-t",
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80" onClick={() => ctx.onOpenChange(false)} />
      <div
        ref={contentRef}
        className={cn(
          "fixed z-50 bg-[var(--color-surface)] p-6 shadow-lg animate-in",
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
        <button
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 text-[var(--color-text-muted)]"
          onClick={() => ctx.onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-[var(--color-text-primary)]", className)} {...props} />
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle }
