import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { AuditLogViewer } from "./audit-viewer"

export default async function AdminAuditPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Audit Log</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Track system activity and changes</p>
      </div>
      <AuditLogViewer />
    </div>
  )
}
