import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-[var(--color-text-primary)]">404</p>
      <h1 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}
