"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const DropdownContext = React.createContext<DropdownContextValue>({
  open: false,
  onOpenChange: () => {},
  triggerRef: { current: null },
})

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, onOpenChange: setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  )
}

function DropdownMenuTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DropdownContext)

  return (
    <button ref={ctx.triggerRef} onClick={() => ctx.onOpenChange(!ctx.open)} {...props}>
      {children}
    </button>
  )
}

function DropdownMenuContent({ className, align = "end", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  const ctx = React.useContext(DropdownContext)
  if (!ctx.open) return null

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-md animate-in fade-in-0 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownContext)

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        ctx.onOpenChange(false)
      }}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-[var(--color-border)]", className)} {...props} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
