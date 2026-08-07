import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { getMyStudents, getPendingReviews, getTeacherStats } from "@/modules/teacher/teacher.actions"
import { Card } from "@/components/ui/card"
import { PendingReviewsList } from "./pending-reviews"

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
          <PendingReviewsList
            experiences={pending.experiences.map((exp) => ({
              ...exp,
              date: exp.date instanceof Date ? exp.date.toISOString() : exp.date,
            }))}
          />
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
            {students.map((student) => {
              const total = student.experiences.length
              const approved = student.approvedCount
              const hours = student.totalHours
              const strandCoverage = student.strandCount
              const pct = total > 0 ? Math.round((approved / total) * 100) : 0
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
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base font-bold text-[var(--color-text-primary)]">{hours}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">hours</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[var(--color-text-primary)]">{strandCoverage}/3</p>
                      <p className="text-xs text-[var(--color-text-muted)]">strands</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-emerald-400">{approved}/{total}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">approved</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-[var(--color-surface-hover)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
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
