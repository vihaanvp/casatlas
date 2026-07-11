import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { getMyStudents, getPendingReviews, getTeacherStats } from "@/modules/teacher/teacher.actions"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { EXPERIENCE_STATUS_LABELS, EXPERIENCE_STATUS_COLORS } from "@/lib/constants"
import type { Strand } from "@prisma/client"

export default async function TeacherDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/dashboard")

  const [stats, pending, students] = await Promise.all([
    getTeacherStats(),
    getPendingReviews(),
    getMyStudents(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Teacher Dashboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Review student experiences and track progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Reviews", value: stats.pendingCount, color: "text-amber-400" },
          { label: "Approved", value: stats.approvedCount, color: "text-emerald-400" },
          { label: "Needs Revision", value: stats.revisionCount, color: "text-red-400" },
          { label: "Students", value: stats.studentCount, color: "text-blue-400" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-[var(--color-surface)]">
            <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Pending Reviews */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Pending Reviews</h2>
        {pending.experiences.length === 0 ? (
          <Card className="p-6 bg-[var(--color-surface)]">
            <p className="text-sm text-[var(--color-text-muted)]">No pending reviews</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.experiences.map((exp: { id: string; title: string; date: Date | string; status: string; user: { name: string | null; email: string | null }; strands: { strand: Strand }[] }) => (
              <Card key={exp.id} className="p-4 bg-[var(--color-surface)]">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Link href={`/experiences/${exp.id}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:underline">
                      {exp.title}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      by {exp.user.name ?? exp.user.email} · {new Date(exp.date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {exp.strands.map((s: { strand: Strand }) => (
                        <Badge key={s.strand} variant="outline" className="text-xs">
                          {s.strand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge className={`${EXPERIENCE_STATUS_COLORS[exp.status as keyof typeof EXPERIENCE_STATUS_COLORS]} border text-xs`}>
                    {EXPERIENCE_STATUS_LABELS[exp.status as keyof typeof EXPERIENCE_STATUS_LABELS]}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Assigned Students */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Assigned Students</h2>
        {students.length === 0 ? (
          <Card className="p-6 bg-[var(--color-surface)]">
            <p className="text-sm text-[var(--color-text-muted)]">No assigned students yet. Ask an admin to assign students.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student: { id: string; name: string | null; email: string | null; image: string | null; createdAt: Date; experiences: { id: string; status: string; title: string; date: Date; createdAt: Date }[] }) => {
              const approved = student.experiences.filter((e: { status: string }) => e.status === "APPROVED").length
              const total = student.experiences.length
              return (
                <Card key={student.id} className="p-4 bg-[var(--color-surface)]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
                      {(student.name ?? student.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {student.name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{student.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{total} experiences</span>
                    <span className="text-emerald-400">{approved} approved</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
