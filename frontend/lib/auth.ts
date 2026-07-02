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
  avatarUrl?: string
  role: string
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

export function formatUserRoleLabel(
  user: Pick<StoredUser, "role" | "companyName"> | null | undefined
): string {
  if (!user) return ""
  if (user.role) return user.role
  if (user.companyName) return user.companyName
  return ""
}

function normalizeRole(user: StoredUser | null): string {
  return String(user?.role || "").toLowerCase().replace(/[\s_-]+/g, "")
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
  return normalizeRole(user) === "superadmin"
}

export function isCompanyUser(user: StoredUser | null): boolean {
  const role = normalizeRole(user)
  return role === "company" || role === "owner"
}

export function isDowladaUser(user: StoredUser | null): boolean {
  const role = normalizeRole(user)
  return role === "superadmin" || role === "admin"
}

export function canViewPage(url: string, user: StoredUser | null): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const perms = getStoredUserPermissions()
  if (user.roleId && perms && countGrantedPermissions(perms) > 0) {
    const key = urlToPermissionKey(url)
    if (url.startsWith("/dashboard/reports/") && perms.reports?.view === true) {
      return true
    }
    return perms[key]?.view === true
  }

  return legacyCanViewPage(url, normalizeRole(user))
}

function legacyCanViewPage(url: string, role: string): boolean {
  const adminOnly = ["/dashboard/users", "/dashboard/companies", "/dashboard/configuration"]
  if (adminOnly.some(p => url.startsWith(p))) return role === "superadmin"

  const staffAdmin = ["/dashboard/owners", "/dashboard/payments", "/dashboard/reports"]
  if (staffAdmin.some(p => url.startsWith(p))) return role === "superadmin" || role === "admin"

  return true
}

export function getDefaultPermissionsForRole(roleId?: number): RolePermissionMap {
  if (!roleId) return createEmptyRolePermissions()
  return getRolePagePermissions(roleId)
}
