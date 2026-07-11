import { describe, it, expect } from "vitest"
import { getPermissions, hasPermission, hasAnyPermission, Permission } from "./rbac"

describe("RBAC", () => {
  describe("getPermissions", () => {
    it("returns student permissions", () => {
      const perms = getPermissions("STUDENT")
      expect(perms).toContain(Permission.CREATE_EXPERIENCE)
      expect(perms).toContain(Permission.EDIT_OWN_EXPERIENCE)
      expect(perms).not.toContain(Permission.APPROVE_EXPERIENCE)
      expect(perms).not.toContain(Permission.MANAGE_USERS)
    })

    it("returns teacher permissions including student ones", () => {
      const perms = getPermissions("TEACHER")
      expect(perms).toContain(Permission.CREATE_EXPERIENCE)
      expect(perms).toContain(Permission.APPROVE_EXPERIENCE)
      expect(perms).toContain(Permission.VIEW_ASSIGNED_STUDENTS)
      expect(perms).not.toContain(Permission.MANAGE_USERS)
    })

    it("returns admin permissions including all", () => {
      const perms = getPermissions("ADMIN")
      expect(perms).toContain(Permission.CREATE_EXPERIENCE)
      expect(perms).toContain(Permission.APPROVE_EXPERIENCE)
      expect(perms).toContain(Permission.MANAGE_USERS)
      expect(perms).toContain(Permission.VIEW_AUDIT_LOGS)
      expect(perms).toContain(Permission.PERMANENTLY_DELETE)
    })
  })

  describe("hasPermission", () => {
    it("grants student permission to create experience", () => {
      expect(hasPermission("STUDENT", Permission.CREATE_EXPERIENCE)).toBe(true)
    })

    it("denies student permission to approve experience", () => {
      expect(hasPermission("STUDENT", Permission.APPROVE_EXPERIENCE)).toBe(false)
    })

    it("grants teacher permission to approve experience", () => {
      expect(hasPermission("TEACHER", Permission.APPROVE_EXPERIENCE)).toBe(true)
    })

    it("grants admin all permissions", () => {
      const allPerms = Object.values(Permission)
      for (const perm of allPerms) {
        expect(hasPermission("ADMIN", perm)).toBe(true)
      }
    })
  })

  describe("hasAnyPermission", () => {
    it("returns true if user has any of the required permissions", () => {
      expect(hasAnyPermission("STUDENT", [Permission.MANAGE_USERS, Permission.CREATE_EXPERIENCE])).toBe(true)
    })

    it("returns false if user has none of the required permissions", () => {
      expect(hasAnyPermission("STUDENT", [Permission.MANAGE_USERS, Permission.APPROVE_EXPERIENCE])).toBe(false)
    })
  })

  describe("role hierarchy", () => {
    it("admin has all teacher permissions", () => {
      const teacherPerms = getPermissions("TEACHER")
      for (const perm of teacherPerms) {
        expect(hasPermission("ADMIN", perm)).toBe(true)
      }
    })

    it("teacher has all student permissions", () => {
      const studentPerms = getPermissions("STUDENT")
      for (const perm of studentPerms) {
        expect(hasPermission("TEACHER", perm)).toBe(true)
      }
    })
  })
})
