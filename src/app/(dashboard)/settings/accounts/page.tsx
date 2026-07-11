import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "../components/settings-nav"
import { Badge } from "@/components/ui/badge"

export default async function AccountsPage() {
  const session = await auth()

  const accounts = await prisma.account.findMany({
    where: { userId: session!.user.id },
  })

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your linked authentication providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accounts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No accounts connected. You are signed in via an OAuth provider.
                </p>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)] capitalize">
                        {account.provider}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Connected account
                      </p>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
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
