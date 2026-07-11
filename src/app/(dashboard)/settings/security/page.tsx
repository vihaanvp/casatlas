import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "../components/settings-nav"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function SecurityPage() {
  const session = await auth()

  const [, sessions] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session!.user.id },
      select: { provider: true },
    }),
    prisma.session.findMany({
      where: { userId: session!.user.id },
      orderBy: { expires: "desc" },
      take: 5,
      select: { expires: true },
    }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                CASAtlas uses OAuth for authentication. Your password is managed by your provider (Google or GitHub).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Your recent sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No active sessions.</p>
              ) : (
                sessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3"
                  >
                    <div>
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {i === 0 ? "Current session" : `Session ${i + 1}`}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Expires {formatDate(s.expires)}
                      </p>
                    </div>
                    <Badge variant={i === 0 ? "default" : "secondary"}>
                      {new Date(s.expires) > new Date() ? "Active" : "Expired"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
