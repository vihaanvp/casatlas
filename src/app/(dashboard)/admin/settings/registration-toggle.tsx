"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { setRegistrationState } from "@/modules/admin/admin.actions"

export function RegistrationToggle({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  const [saving, setSaving] = useState(false)

  async function handleToggle(checked: boolean) {
    setSaving(true)
    try {
      await setRegistrationState(checked)
      setOpen(checked)
      toast.success(checked ? "Registration enabled" : "Registration disabled")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Allow new registrations</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {open
            ? "New accounts can sign up. Existing users can always sign in."
            : "New account sign-ups are blocked. Existing users can still sign in."}
        </p>
      </div>
      <Switch checked={open} onCheckedChange={handleToggle} disabled={saving} />
    </div>
  )
}
