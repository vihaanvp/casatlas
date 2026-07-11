"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/modules/experiences/experience.actions"
import { toast } from "sonner"

interface ProfileFormProps {
  name: string
}

function ProfileForm({ name }: ProfileFormProps) {
  const router = useRouter()
  const [value, setValue] = React.useState(name)
  const [saving, setSaving] = React.useState(false)
  const hasChanged = value !== name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    setSaving(true)
    try {
      const result = await updateProfile({ name: value.trim() })
      if (result.success) {
        toast.success("Profile updated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          maxLength={100}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!hasChanged || saving} size="sm">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

export { ProfileForm }
