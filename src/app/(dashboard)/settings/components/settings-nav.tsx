"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  User,
  Palette,
  Shield,
  Key,
  Accessibility,
  SlidersHorizontal,
} from "lucide-react"

const settingsItems = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/accessibility", label: "Accessibility", icon: Accessibility },
  { href: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
  { href: "/settings/accounts", label: "Connected Accounts", icon: Key },
  { href: "/settings/security", label: "Security", icon: Shield },
]

function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="w-full lg:w-56 shrink-0">
      <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto">
        {settingsItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export { SettingsNav }
