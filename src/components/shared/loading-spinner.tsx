import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin text-[var(--color-accent)]", sizeClasses[size], className)} />
  )
}

function LoadingPage() {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export { LoadingSpinner, LoadingPage }
