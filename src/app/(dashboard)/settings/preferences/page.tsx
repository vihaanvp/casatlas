"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "../components/settings-nav"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Preferences {
  defaultLanding: string
  defaultExperienceView: string
}

const DEFAULTS: Preferences = {
  defaultLanding: "/dashboard",
  defaultExperienceView: "cards",
}

function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem("casatlas-preferences")
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function savePreferences(prefs: Preferences) {
  localStorage.setItem("casatlas-preferences", JSON.stringify(prefs))
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = React.useState<Preferences>(DEFAULTS)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setPrefs(loadPreferences())
    setMounted(true)
  }, [])

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePreferences(next)
    toast.success("Preference saved")
  }

  if (!mounted) return null

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="landing" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Default landing page
                </Label>
                <p className="text-xs text-[var(--color-text-muted)]">Choose where you go after signing in.</p>
                <select
                  id="landing"
                  value={prefs.defaultLanding}
                  onChange={(e) => update("defaultLanding", e.target.value)}
                  className="h-10 w-full max-w-xs rounded-md border border-[var(--color-input)] bg-transparent px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
                >
                  <option value="/dashboard">Dashboard</option>
                  <option value="/experiences">Experiences</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="view" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Default experience view
                </Label>
                <p className="text-xs text-[var(--color-text-muted)]">Choose how experiences are displayed by default.</p>
                <select
                  id="view"
                  value={prefs.defaultExperienceView}
                  onChange={(e) => update("defaultExperienceView", e.target.value)}
                  className="h-10 w-full max-w-xs rounded-md border border-[var(--color-input)] bg-transparent px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
                >
                  <option value="cards">Cards</option>
                  <option value="table">Table</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
