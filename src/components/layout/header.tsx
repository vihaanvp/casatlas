"use client"

import Link from "next/link"
import { Menu, BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: "STUDENT" | "TEACHER" | "ADMIN"
  }
  notificationBell?: React.ReactNode
}

function Header({ user, notificationBell }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 lg:hidden">
      <Sheet>
        <SheetTrigger>
          <Button variant="ghost" size="icon" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar user={user} />
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
          <BookOpen className="h-4 w-4 text-[var(--color-accent-foreground)]" />
        </div>
        <span className="text-lg font-bold text-[var(--color-text-primary)]">CASAtlas</span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        {notificationBell}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
          }}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

export { Header }
