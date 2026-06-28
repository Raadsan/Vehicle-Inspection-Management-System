import {
  countGrantedPermissions,
  createEmptyRolePermissions,
  type RolePermissionMap,
} from "@/lib/navigation-config"
import { getRolePagePermissions } from "@/lib/role-permissions-store"

export interface StoredUser {
  id: number
  username: string
  email?: string
  fullName?: string
  role: "SUPER_ADMIN" | "OWNER" | "INSPECTOR" | "STAFF"
  roleId?: number
  companyId: number
  companyName?: string
}

function urlToPermissionKey(url: string): string {
  return url
    .replace(/^\/dashboard\/?/, "")
    .replace(/\//g, ".")
    .replace(/^$/, "dashboard")
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    return raw ? (JSON.parse(raw) as StoredUser) : null
  } catch {
    return null
  }
}

export function getStoredUserPermissions(): RolePermissionMap | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("userPagePermissions")
    return raw ? (JSON.parse(raw) as RolePermissionMap) : null
  } catch {
    return null
  }
}

export function hydrateUserPermissions(roleId?: number) {
  if (!roleId) {
    localStorage.removeItem("userPagePermissions")
    return
  }
  const perms = getRolePagePermissions(roleId)
  localStorage.setItem("userPagePermissions", JSON.stringify(perms))
}

export function isSuperAdmin(user: StoredUser | null): boolean {
  return user?.role === "SUPER_ADMIN"
}

export function isCompanyUser(user: StoredUser | null): boolean {
  return user?.role === "OWNER"
}

export function canViewPage(url: string, user: StoredUser | null): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const perms = getStoredUserPermissions()
  if (user.roleId && perms && countGrantedPermissions(perms) > 0) {
    const key = urlToPermissionKey(url)
    return perms[key]?.view === true
  }

  return legacyCanViewPage(url, user.role)
}

function legacyCanViewPage(url: string, role: StoredUser["role"]): boolean {
  const adminOnly = ["/dashboard/users", "/dashboard/companies", "/dashboard/configuration"]
  if (adminOnly.some(p => url.startsWith(p))) return role === "SUPER_ADMIN"

  const staffAdmin = ["/dashboard/owners", "/dashboard/payments", "/dashboard/reports"]
  if (staffAdmin.some(p => url.startsWith(p))) return role === "SUPER_ADMIN" || role === "STAFF"

  return true
}

export function getDefaultPermissionsForRole(roleId?: number): RolePermissionMap {
  if (!roleId) return createEmptyRolePermissions()
  return getRolePagePermissions(roleId)
}
