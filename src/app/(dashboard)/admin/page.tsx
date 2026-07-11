import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { getUsers, getSystemStats, getTeachers } from "@/modules/admin/admin.actions"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, BookOpen, MessageSquare, Shield } from "lucide-react"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const [stats, usersResult, teachers] = await Promise.all([
    getSystemStats(),
    getUsers({ pageSize: 10 }),
    getTeachers(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Admin Dashboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">System overview and user management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
          { label: "Experiences", value: stats.totalExperiences, icon: BookOpen, color: "text-emerald-400" },
          { label: "Uploads", value: stats.totalUploads, icon: Shield, color: "text-purple-400" },
          { label: "Comments", value: stats.totalComments, icon: MessageSquare, color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-[var(--color-surface)]">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Users by Role</h2>
          <Card className="p-4 bg-[var(--color-surface)]">
            <div className="space-y-3">
              {(["STUDENT", "TEACHER", "ADMIN"] as const).map((role) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{stats.usersByRole[role] ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Experiences by Status</h2>
          <Card className="p-4 bg-[var(--color-surface)]">
            <div className="space-y-3">
              {Object.entries(stats.experiencesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">{status}</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* Teachers */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Teachers</h2>
        {teachers.length === 0 ? (
          <Card className="p-6 bg-[var(--color-surface)]">
            <p className="text-sm text-[var(--color-text-muted)]">No teachers yet. Promote a user to teacher role.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((t: { id: string; name: string | null; email: string | null; _count: { assignedStudents: number } }) => (
              <Card key={t.id} className="p-4 bg-[var(--color-surface)]">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
                    {(t.name ?? t.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{t.name ?? "Unnamed"}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{t.email}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{t._count.assignedStudents} assigned students</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent Users */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Users</h2>
          <Link href="/admin/users" className="text-sm text-[var(--color-accent)] hover:underline">
            View all
          </Link>
        </div>
        <Card className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          {usersResult.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
                  {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{u.name ?? "Unnamed"}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{u.email}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{u.role}</Badge>
            </div>
          ))}
        </Card>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: "/admin/users", label: "User Management", description: "Manage users and roles" },
            { href: "/admin/audit", label: "Audit Log", description: "View system activity" },
            { href: "/admin/assignments", label: "Teacher Assignments", description: "Assign students to teachers" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="p-4 bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors cursor-pointer">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{link.label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{link.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
