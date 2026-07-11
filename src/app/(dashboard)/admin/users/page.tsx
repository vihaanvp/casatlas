import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { UserManagement } from "./user-management"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">User Management</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Manage users and their roles</p>
      </div>
      <UserManagement />
    </div>
  )
}
