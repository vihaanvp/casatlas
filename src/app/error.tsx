"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-[var(--color-destructive)]">!</p>
      <h1 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  )
}
