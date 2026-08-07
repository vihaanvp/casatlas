import { auth } from "@/modules/auth/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationToggle } from "./registration-toggle"
import { getRegistrationState } from "@/modules/admin/admin.actions"

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const registrationOpen = await getRegistrationState()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Runtime configuration — no redeploy needed</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
          <CardDescription>
            Control whether new accounts can sign up. The value takes effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationToggle initialOpen={registrationOpen} />
        </CardContent>
      </Card>
    </div>
  )
}
