import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)]">
              <BookOpen className="h-5 w-5 text-[var(--color-accent-foreground)]" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">CASAtlas</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Document and manage your IB CAS journey
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
