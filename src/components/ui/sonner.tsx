"use client"

import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "next-themes"

function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <SonnerToaster
      theme={resolvedTheme as "light" | "dark" | "system" ?? "dark"}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        },
      }}
    />
  )
}

export { Toaster }
