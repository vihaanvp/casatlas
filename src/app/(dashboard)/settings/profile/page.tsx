import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "@/app/(dashboard)/settings/components/settings-nav"
import { Avatar } from "@/components/ui/avatar"
import { ProfileForm } from "./profile-form"
import { formatDate } from "@/lib/utils"

export default async function ProfilePage() {
  const session = await auth()
  const user = session?.user

  const [stats, accountCount, dbUser] = await Promise.all([
    prisma.experience.aggregate({
      where: { userId: session!.user.id, deletedAt: null },
      _count: true,
      _sum: { hours: true },
    }),
    prisma.account.count({ where: { userId: session!.user.id } }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { createdAt: true },
    }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar
                  src={user?.image}
                  name={user?.name || user?.email || "User"}
                  size="lg"
                />
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{user?.name || "No name set"}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user?.email || "No email"}</p>
                </div>
              </div>
              <ProfileForm name={user?.name || ""} />
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>Your CAS journey at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-[var(--color-text-muted)]">Total Experiences</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats._count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[var(--color-text-muted)]">Total Hours</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats._sum.hours ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[var(--color-text-muted)]">Connected Accounts</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{accountCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Current session information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">Member since</span>
                <span className="text-sm text-[var(--color-text-primary)]">
                  {formatDate(dbUser?.createdAt ?? new Date())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
                <span className="text-sm text-[var(--color-text-primary)]">{user?.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
