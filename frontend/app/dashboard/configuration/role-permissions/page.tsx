"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Save, Shield } from "lucide-react"
import toast from "react-hot-toast"
import {
  roleApi,
  permissionApi,
  rolePermissionApi,
  Role,
  Permission,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
  dashboardCardClass,
} from "@/lib/dashboard-ui"

const selectCls =
  "w-full max-w-md h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [rolesData, permsData] = await Promise.all([
          roleApi.getAll(),
          permissionApi.getAll(),
        ])
        setRoles(rolesData)
        setPermissions(permsData)
      } catch (err: any) {
        toast.error("Failed to load data: " + (err.response?.data?.error || err.message))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedRoleId) {
      setAssignedIds(new Set())
      return
    }
    const loadAssignments = async () => {
      try {
        const data = await rolePermissionApi.getByRole(Number(selectedRoleId))
        setAssignedIds(new Set(data.map((a) => a.permissionId)))
      } catch (err: any) {
        toast.error("Failed to load permissions: " + (err.response?.data?.error || err.message))
      }
    }
    loadAssignments()
  }, [selectedRoleId])

  const togglePermission = (id: number) => {
    setAssignedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await rolePermissionApi.setForRole(Number(selectedRoleId), Array.from(assignedIds))
      toast.success("Role permissions updated")
    } catch (err: any) {
      toast.error("Failed to save: " + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.feature]) acc[p.feature] = []
    acc[p.feature].push(p)
    return acc
  }, {})

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Role Permissions</h1>
        <p className={pageHeaderSubtitleClass}>Assign permissions to roles</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-border flex flex-wrap items-end gap-4 justify-between">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#0a2744] dark:text-zinc-300">Select Role</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className={selectCls}
            >
              <option value="">Choose a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          {selectedRoleId && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-10 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold px-5 rounded-md flex items-center gap-2 text-sm"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Permissions
            </Button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="size-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : !selectedRoleId ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            Select a role to manage its permissions
          </div>
        ) : permissions.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            No permissions defined yet. Add permissions via the API or database seed.
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {Object.entries(grouped).map(([feature, perms]) => (
              <div key={feature}>
                <h3 className="text-sm font-semibold text-[#0a2744] dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="size-4 text-[#1565c0]" />
                  {feature}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {perms.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 dark:border-border hover:bg-zinc-50 dark:hover:bg-muted/20 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={assignedIds.has(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="mt-0.5 size-4 accent-[#1565c0]"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">{p.action}</span>
                        <span className="text-[11px] text-zinc-400 block font-normal">{p.code}</span>
                        {p.description && (
                          <span className="text-[11px] text-zinc-500 block font-normal">{p.description}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
