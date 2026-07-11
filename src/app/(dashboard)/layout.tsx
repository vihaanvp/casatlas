import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CommandDialogProvider } from "@/components/shared/command-dialog-provider"
import { NotificationBell } from "@/components/shared/notification-bell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <CommandDialogProvider>
      <div className="flex min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-2 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-[var(--color-accent-foreground)] focus:outline-none"
        >
          Skip to content
        </a>
        <Sidebar user={session.user} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header user={session.user} notificationBell={<NotificationBell />} />
          <main id="main-content" className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </CommandDialogProvider>
  )
}
