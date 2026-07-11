"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  Search,
  ShieldCheck,
  GraduationCap,
  FileText,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "./theme-toggle"
import { signOutAction } from "@/modules/auth/auth.actions"

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/experiences", label: "Experiences", icon: BookOpen },
  { href: "/portfolio", label: "Portfolio", icon: FileText },
]

const teacherNav = [
  { href: "/teacher", label: "Teacher Dashboard", icon: GraduationCap },
]

const adminNav = [
  { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
]

const bottomNav = [
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: "STUDENT" | "TEACHER" | "ADMIN"
  }
}

function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const role = user?.role ?? "STUDENT"
  const isTeacher = role === "TEACHER" || role === "ADMIN"
  const isAdmin = role === "ADMIN"

  const allNav = [
    ...studentNav,
    ...(isTeacher ? teacherNav : []),
    ...(isAdmin ? adminNav : []),
    ...bottomNav,
  ]

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
          <BookOpen className="h-4 w-4 text-[var(--color-accent-foreground)]" />
        </div>
        <span className="text-lg font-bold text-[var(--color-text-primary)]">CASAtlas</span>
      </div>

      <Separator />

      {/* Search hint — triggers Cmd+K */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 font-mono text-[10px] text-[var(--color-text-muted)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {allNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between">
          <Link href="/settings/profile" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
            <Avatar
              src={user?.image}
              name={user?.name || user?.email || "User"}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {role !== "STUDENT" ? `${role.charAt(0)}${role.slice(1).toLowerCase()}` : user?.email || ""}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center h-10 w-10 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
