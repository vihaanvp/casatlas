import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { AssignmentManager } from "./assignment-manager"

export default async function AdminAssignmentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Teacher Assignments</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Assign students to teachers for review</p>
      </div>
      <AssignmentManager />
    </div>
  )
}
