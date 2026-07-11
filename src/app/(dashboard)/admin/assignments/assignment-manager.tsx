"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { assignStudents, getUsers, getTeachers } from "@/modules/admin/admin.actions"
import { toast } from "sonner"

interface Teacher { id: string; name: string | null; email: string | null; _count: { assignedStudents: number } }
interface Student { id: string; name: string | null; email: string | null; role: string }

export function AssignmentManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, s] = await Promise.all([getTeachers(), getUsers({ role: "STUDENT", pageSize: 200 })])
      setTeachers(t as Teacher[])
      setStudents(s.users as Student[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAssign() {
    if (!selectedTeacher || selectedStudents.size === 0) return
    try {
      await assignStudents(selectedTeacher, Array.from(selectedStudents))
      toast.success(`Assigned ${selectedStudents.size} students`)
      setSelectedStudents(new Set())
    } catch {
      toast.error("Failed to assign students")
    }
  }

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)]">Select Teacher</label>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="mt-1 block w-full max-w-md rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">Choose a teacher...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name ?? t.email} ({t._count.assignedStudents} assigned)</option>
          ))}
        </select>
      </div>

      {selectedTeacher && (
        <>
          <p className="text-sm text-[var(--color-text-muted)]">
            Select students to assign ({selectedStudents.size} selected)
          </p>
          <Card className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)] max-h-96 overflow-auto">
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)]">
                <input
                  type="checkbox"
                  checked={selectedStudents.has(s.id)}
                  onChange={(e) => {
                    const next = new Set(selectedStudents)
                    if (e.target.checked) { next.add(s.id) } else { next.delete(s.id) }
                    setSelectedStudents(next)
                  }}
                  className="rounded border-[var(--color-border)]"
                />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)]">{s.name ?? "Unnamed"}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{s.email}</p>
                </div>
              </label>
            ))}
          </Card>
          <Button onClick={handleAssign} disabled={selectedStudents.size === 0}>
            Assign {selectedStudents.size} Students
          </Button>
        </>
      )}
    </div>
  )
}
