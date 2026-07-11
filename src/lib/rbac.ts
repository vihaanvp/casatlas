import type { Role } from "@prisma/client"

// ─── Permissions ─────────────────────────────────────────

export const Permission = {
  // Experience
  CREATE_EXPERIENCE: "create_experience",
  EDIT_OWN_EXPERIENCE: "edit_own_experience",
  DELETE_OWN_EXPERIENCE: "delete_own_experience",
  SUBMIT_EXPERIENCE: "submit_experience",
  VIEW_OWN_EXPERIENCE: "view_own_experience",

  // Teacher
  VIEW_ASSIGNED_STUDENTS: "view_assigned_students",
  REVIEW_EXPERIENCE: "review_experience",
  APPROVE_EXPERIENCE: "approve_experience",
  REQUEST_REVISION: "request_revision",
  ADD_COMMENT: "add_comment",
  RESTORE_EXPERIENCE: "restore_experience",

  // Admin
  MANAGE_USERS: "manage_users",
  MANAGE_TEACHERS: "manage_teachers",
  PERMANENTLY_DELETE: "permanently_delete",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_SYSTEM_STATS: "view_system_stats",
  MANAGE_CONFIG: "manage_config",
  MANAGE_ALL_STUDENTS: "manage_all_students",
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

// ─── Helpers ─────────────────────────────────────────────

export function getPermissions(role: Role): Permission[] {
  const STUDENT: Permission[] = [
    Permission.CREATE_EXPERIENCE,
    Permission.EDIT_OWN_EXPERIENCE,
    Permission.DELETE_OWN_EXPERIENCE,
    Permission.SUBMIT_EXPERIENCE,
    Permission.VIEW_OWN_EXPERIENCE,
  ]

  const TEACHER: Permission[] = [
    ...STUDENT,
    Permission.VIEW_ASSIGNED_STUDENTS,
    Permission.REVIEW_EXPERIENCE,
    Permission.APPROVE_EXPERIENCE,
    Permission.REQUEST_REVISION,
    Permission.ADD_COMMENT,
    Permission.RESTORE_EXPERIENCE,
  ]

  const ADMIN: Permission[] = [
    ...TEACHER,
    Permission.MANAGE_USERS,
    Permission.MANAGE_TEACHERS,
    Permission.PERMANENTLY_DELETE,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_SYSTEM_STATS,
    Permission.MANAGE_CONFIG,
    Permission.MANAGE_ALL_STUDENTS,
  ]

  const map: Record<Role, Permission[]> = { STUDENT, TEACHER, ADMIN }
  return map[role] ?? []
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissions(role).includes(permission)
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

/** Throws if user lacks permission. Use in server actions. */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: requires ${permission}`)
  }
}
