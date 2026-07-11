import * as React from "react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
}

function Avatar({ src, alt, name, size = "md", className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || name || ""} className="aspect-square h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-medium">
          {name ? getInitials(name) : "?"}
        </div>
      )}
    </div>
  )
}

export { Avatar }
