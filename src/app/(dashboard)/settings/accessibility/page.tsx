"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "../components/settings-nav"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AccessibilitySettings {
  reducedMotion: boolean
  increasedContrast: boolean
  largerFonts: boolean
}

const DEFAULTS: AccessibilitySettings = {
  reducedMotion: false,
  increasedContrast: false,
  largerFonts: false,
}

function loadSettings(): AccessibilitySettings {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem("casatlas-accessibility")
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function saveSettings(settings: AccessibilitySettings) {
  localStorage.setItem("casatlas-accessibility", JSON.stringify(settings))
  applySettings(settings)
}

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement
  root.classList.toggle("reduce-motion", settings.reducedMotion)
  root.classList.toggle("increase-contrast", settings.increasedContrast)
  root.classList.toggle("larger-fonts", settings.largerFonts)
}

export default function AccessibilityPage() {
  const [settings, setSettings] = React.useState<AccessibilitySettings>(DEFAULTS)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    applySettings(s)
    setMounted(true)
  }, [])

  const update = (key: keyof AccessibilitySettings, value: boolean) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
    toast.success("Accessibility setting updated")
  }

  if (!mounted) return null

  const toggles: { key: keyof AccessibilitySettings; label: string; description: string }[] = [
    {
      key: "reducedMotion",
      label: "Reduce motion",
      description: "Minimize animations and transitions throughout the interface",
    },
    {
      key: "increasedContrast",
      label: "Increase contrast",
      description: "Use higher contrast colors for better readability",
    },
    {
      key: "largerFonts",
      label: "Larger font sizes",
      description: "Increase base font size across the application",
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>Customize accessibility settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {toggles.map((t) => (
                <div key={t.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={t.key} className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t.label}
                    </Label>
                    <p className="text-xs text-[var(--color-text-muted)]">{t.description}</p>
                  </div>
                  <Switch
                    id={t.key}
                    checked={settings[t.key]}
                    onCheckedChange={(checked) => update(t.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
