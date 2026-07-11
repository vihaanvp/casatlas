"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchNotifications, fetchUnreadCount, markNotificationRead } from "@/modules/notifications/notification.actions"
import type { Notification } from "@prisma/client"

function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<(Notification & { link?: string | null })[]>([])

  useEffect(() => {
    fetchUnreadCount().then(setUnread)
    const interval = setInterval(() => {
      fetchUnreadCount().then(setUnread)
    }, 30_000) // ponytail: poll every 30s, replace with SSE/WebSocket if needed
    return () => clearInterval(interval)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      const { notifications: n } = await fetchNotifications(1, false)
      setNotifications(n)
    }
  }

  async function markRead(id: string) {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await markNotificationRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Notifications" className="relative">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-accent-foreground)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[var(--color-accent)] hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-text-muted)]">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-[var(--color-border)] px-4 py-3 last:border-0 ${n.read ? "opacity-60" : ""}`}
                >
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{n.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.message}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-[var(--color-accent)] hover:underline">
                        Mark read
                      </button>
                    )}
                    {n.link && (
                      <a href={n.link} className="text-xs text-[var(--color-accent)] hover:underline" onClick={() => setOpen(false)}>
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export { NotificationBell }
