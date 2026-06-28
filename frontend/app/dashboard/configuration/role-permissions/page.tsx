"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Edit, Eye, Loader2, Plus, Shield, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { roleApi, Role } from "@/lib/api"
import { RolePermissionsEditor } from "@/components/role-permissions-editor"
import { cn } from "@/lib/utils"
import {
  countGrantedPermissions,
  createEmptyRolePermissions,
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

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permMap, setPermMap] = useState<Record<number, RolePermissionMap>>({})
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [draftPerms, setDraftPerms] = useState<RolePermissionMap>(createEmptyRolePermissions())

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await roleApi.getAll()
      setRoles(data)
      const map: Record<number, RolePermissionMap> = {}
      for (const role of data) {
        map[role.id] = getRolePagePermissions(role.id)
      }
      setPermMap(map)
    } catch (err: any) {
      toast.error("Failed to load roles: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoles()
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

  const handleSave = async () => {
    if (!editingRole) return
    setSaving(true)
    try {
      saveRolePagePermissions(editingRole.id, draftPerms)
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
          onSave={handleSave}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  )
}
