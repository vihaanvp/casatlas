import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export { PageHeader }
