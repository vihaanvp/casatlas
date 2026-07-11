import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-hover)] mb-4">
          <Icon className="h-6 w-6 text-[var(--color-text-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-medium text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }
