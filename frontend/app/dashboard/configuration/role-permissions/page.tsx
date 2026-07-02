"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Edit, Eye, Loader2, Plus, Shield, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { permissionApi, roleApi, rolePermissionApi, Permission, Role, RolePermission } from "@/lib/api"
import { RolePermissionsEditor } from "@/components/role-permissions-editor"
import { cn } from "@/lib/utils"
import {
  countGrantedPermissions,
  createEmptyRolePermissions,
  getAllPermissionPages,
  PERMISSION_ACTIONS,
  type PermissionAction,
  type RolePermissionMap,
} from "@/lib/navigation-config"
import {
  getRolePagePermissions,
  saveRolePagePermissions,
} from "@/lib/role-permissions-store"
import { logAudit } from "@/lib/audit-log"
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui"

const ACTION_BADGE_ICONS = [
  { key: "add" as const, Icon: Plus },
  { key: "view" as const, Icon: Eye },
  { key: "edit" as const, Icon: Edit },
  { key: "delete" as const, Icon: Trash2 },
]

const PAGE_FEATURES: Record<string, string> = {
  dashboard: "dashboard",
  users: "users",
  companies: "companies",
  owners: "owners",
  vehicles: "vehicles",
  brands: "brands",
  models: "models",
  colors: "colors",
  "registration-fees": "registration-fees",
  inspections: "inspections",
  "inspections.check": "inspections",
  "inspections.items": "inspection-items",
  "inspections.approval": "inspections",
  "inspections.approved": "inspections",
  "inspections.expired": "inspections",
  "inspections.rejected": "inspections",
  "payments.customers": "customer-payments",
  "payments.invoices": "invoices",
  "reports.vehicles": "reports",
  "reports.payments": "reports",
  "reports.inspections": "reports",
  "configuration.roles": "roles",
  "configuration.role-permissions": "role-permissions",
  "configuration.audit-log": "audit-log",
}

function backendAction(action: PermissionAction) {
  return action === "add" ? "create" : action
}

function getErrorMessage(err: unknown) {
  const e = err as { response?: { data?: { error?: string } }; message?: string }
  return e.response?.data?.error || e.message || "Unknown error"
}

function assignmentsToPagePerms(assignments: RolePermission[]): RolePermissionMap {
  const map = createEmptyRolePermissions()
  for (const page of getAllPermissionPages()) {
    const feature = PAGE_FEATURES[page.key] || page.key
    for (const action of ["view", "add", "edit", "delete"] as PermissionAction[]) {
      const expectedAction = backendAction(action)
      map[page.key][action] = assignments.some(({ permission }) =>
        permission?.feature === feature &&
        (permission.action === expectedAction || permission.action === "manage")
      )
    }
  }
  return map
}

function pagePermsToPermissionIds(perms: RolePermissionMap, permissions: Permission[]) {
  const ids = new Set<number>()
  for (const page of getAllPermissionPages()) {
    const feature = PAGE_FEATURES[page.key] || page.key
    const row = perms[page.key]
    if (!row) continue
    for (const action of ["view", "add", "edit", "delete"] as PermissionAction[]) {
      if (!row[action]) continue
      const code = `${feature}.${backendAction(action)}`
      const permission = permissions.find((item) => item.code === code)
      if (permission) ids.add(permission.id)
    }
  }
  return Array.from(ids)
}

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permMap, setPermMap] = useState<Record<number, RolePermissionMap>>({})
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [draftPerms, setDraftPerms] = useState<RolePermissionMap>(createEmptyRolePermissions())

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      const [data, allPermissions] = await Promise.all([roleApi.getAll(), permissionApi.getAll()])
      setRoles(data)
      setPermissions(allPermissions)
      const map: Record<number, RolePermissionMap> = {}
      for (const role of data) {
        try {
          const assignments = await rolePermissionApi.getByRole(role.id)
          map[role.id] = assignments.length ? assignmentsToPagePerms(assignments) : getRolePagePermissions(role.id)
        } catch {
          map[role.id] = getRolePagePermissions(role.id)
        }
      }
      setPermMap(map)
    } catch (err: unknown) {
      toast.error("Failed to load roles: " + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => { loadRoles() }, 0)
    return () => window.clearTimeout(id)
  }, [loadRoles])

  const openEditor = (role: Role) => {
    setEditingRole(role)
    setDraftPerms({ ...(permMap[role.id] || getRolePagePermissions(role.id)) })
  }

  const togglePermission = (pageKey: string, action: PermissionAction) => {
    setDraftPerms((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [action]: !prev[pageKey]?.[action],
      },
    }))
  }

  const setAllPermissions = (granted: boolean) => {
    const next = createEmptyRolePermissions()
    for (const page of getAllPermissionPages()) {
      for (const { key } of PERMISSION_ACTIONS) {
        next[page.key][key] = granted
      }
    }
    setDraftPerms(next)
  }

  const handleSave = async () => {
    if (!editingRole) return
    setSaving(true)
    try {
      saveRolePagePermissions(editingRole.id, draftPerms)
      await rolePermissionApi.setForRole(editingRole.id, pagePermsToPermissionIds(draftPerms, permissions))
      setPermMap((prev) => ({ ...prev, [editingRole.id]: draftPerms }))
      await logAudit({
        action: "UPDATE",
        entity: "RolePermission",
        entityId: editingRole.id,
        details: `Updated page permissions for role "${editingRole.name}"`,
      })
      toast.success(`Permissions saved for "${editingRole.name}"`)
      setEditingRole(null)
    } catch {
      toast.error("Failed to save permissions")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-6")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Role Permissions</h1>
        <p className={pageHeaderSubtitleClass}>
          Assign View · Add · Edit · Delete for every sidebar page
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-7 animate-spin text-[#1565c0]" />
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl">
          No roles yet. Create roles first on the Roles page.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((role) => {
            const perms = permMap[role.id] || createEmptyRolePermissions()
            const granted = countGrantedPermissions(perms)

            return (
              <div
                key={role.id}
                className="bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1565c0]/10 flex items-center justify-center shrink-0">
                      <Shield className="size-5 text-[#1565c0]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                        {role.name}
                      </h3>
                      {role.description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{role.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-4">
                    {ACTION_BADGE_ICONS.map(({ key, Icon }) => {
                      const count = Object.values(perms).filter((p) => p[key]).length
                      return (
                        <span
                          key={key}
                          title={`${count} pages`}
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center",
                            count > 0
                              ? "bg-[#1565c0] text-white"
                              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          <Icon className="size-3.5" />
                        </span>
                      )
                    })}
                    <span className="text-[11px] text-zinc-400 ml-1">{granted} total</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditor(role)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-zinc-200 dark:border-border rounded-lg text-sm text-zinc-700 dark:text-zinc-200 hover:bg-[#1565c0] hover:text-white hover:border-[#1565c0] font-medium transition-all"
                  >
                    <Edit className="size-3.5" />
                    Edit Permissions
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingRole && (
        <RolePermissionsEditor
          role={editingRole}
          permissions={draftPerms}
          saving={saving}
          onToggle={togglePermission}
          onSetAll={setAllPermissions}
          onSave={handleSave}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  )
}
