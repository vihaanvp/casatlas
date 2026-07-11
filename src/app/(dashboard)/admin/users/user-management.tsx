"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUsers, updateUserRole } from "@/modules/admin/admin.actions"
import { toast } from "sonner"

type Role = "STUDENT" | "TEACHER" | "ADMIN"

interface UserRow {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: Role
  createdAt: Date
  _count: { experiences: number; assignedStudents: number }
}

export function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "">("")
  const [loading, setLoading] = useState(true)
  const [searchVersion, setSearchVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadUsers() {
      setLoading(true)
      try {
        const result = await getUsers({
          pageSize: 50,
          role: roleFilter || undefined,
          search: search || undefined,
        })
        if (!cancelled) setUsers(result.users as UserRow[])
      } catch {
        if (!cancelled) toast.error("Failed to load users")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadUsers()
    return () => { cancelled = true }
  }, [roleFilter, searchVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRoleChange(userId: string, newRole: Role) {
    try {
      await updateUserRole(userId, newRole)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      toast.success("Role updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearchVersion((v) => v + 1)}
          className="max-w-sm bg-[var(--color-surface)]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "")}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button onClick={() => setSearchVersion((v) => v + 1)} variant="outline" size="sm">Search</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No users found</p>
      ) : (
        <Card className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)] shrink-0">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name ?? "Unnamed"}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] hidden sm:block">
                {user._count.experiences} exp
              </div>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
