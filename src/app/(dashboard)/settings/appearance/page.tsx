"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "../components/settings-nav"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { toast } from "sonner"

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ] as const

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {themes.map((t) => (
                  <Button
                    key={t.value}
                    variant={theme === t.value ? "default" : "outline"}
                    onClick={() => {
                      setTheme(t.value)
                      toast.success(`Theme set to ${t.label.toLowerCase()}`)
                    }}
                    className="flex items-center gap-2"
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UI Density</CardTitle>
              <CardDescription>Adjust spacing and compactness of the interface</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-muted)]">
                Density controls will be available in a future update.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent Color</CardTitle>
              <CardDescription>Customize the primary accent color</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-muted)]">
                Custom accent colors will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
