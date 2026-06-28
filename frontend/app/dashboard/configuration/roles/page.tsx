"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, Shield, MoreVertical, Settings, Edit, Trash2, X, Check, Eye, PenLine, FilePlus } from "lucide-react"
import toast from "react-hot-toast"
import { roleApi, permissionApi, rolePermissionApi, Role, Permission } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui"

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionType = "Create" | "View" | "Edit" | "Delete"

const ACTION_META: { type: ActionType; label: string; icon: React.ElementType; badgeLabel: string }[] = [
  { type: "Create", label: "Add",    icon: FilePlus, badgeLabel: "A" },
  { type: "View",   label: "View",   icon: Eye,      badgeLabel: "V" },
  { type: "Edit",   label: "Edit",   icon: PenLine,  badgeLabel: "E" },
  { type: "Delete", label: "Delete", icon: Trash2,   badgeLabel: "D" },
]

// ─── Dropdown Menu ────────────────────────────────────────────────────────────
function RoleMenu({
  role,
  onEdit,
  onDelete,
}: {
  role: Role
  onEdit: (r: Role) => void
  onDelete: (r: Role) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-lg shadow-xl w-44 py-1 overflow-hidden">
            <button
              onClick={() => { setOpen(false); onEdit(role) }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-muted/30 w-full text-left transition-colors"
            >
              <Edit className="size-3.5 text-blue-500" /> Edit Name
            </button>
            <button
              onClick={() => { setOpen(false); onDelete(role) }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
            >
              <Trash2 className="size-3.5" /> Delete Role
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  permissions,
  assignedIds,
  onEditPermissions,
  onEditName,
  onDelete,
}: {
  role: Role
  permissions: Permission[]
  assignedIds: Set<number>
  onEditPermissions: (r: Role) => void
  onEditName: (r: Role) => void
  onDelete: (r: Role) => void
}) {
  const totalAssigned = permissions.filter(p => assignedIds.has(p.id)).length

  return (
    <div className="bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1565c0]/10 flex items-center justify-center shrink-0">
              <Shield className="size-5 text-[#1565c0]" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{role.name}</h3>
              {role.description && (
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{role.description}</p>
              )}
            </div>
          </div>
          <RoleMenu role={role} onEdit={onEditName} onDelete={onDelete} />
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-1.5 mb-4">
          {ACTION_META.map(({ type, badgeLabel }) => {
            const matched = permissions.filter(p =>
              p.action.toLowerCase() === type.toLowerCase() || p.action.toLowerCase() === type.toLowerCase().slice(0, 3)
            )
            const hasAny = matched.some(p => assignedIds.has(p.id))
            return (
              <span
                key={type}
                title={type}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-md text-[10px] font-black transition-colors",
                  hasAny
                    ? "bg-[#1565c0] text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {badgeLabel}
              </span>
            )
          })}
          <span className="text-[11px] text-zinc-400 font-medium ml-1">
            Total {totalAssigned} permissions
          </span>
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEditPermissions(role)}
          className="w-full flex items-center justify-center gap-2 py-2 border border-zinc-200 dark:border-border rounded-lg text-sm text-zinc-600 dark:text-zinc-300 hover:bg-[#1565c0] hover:text-white hover:border-[#1565c0] font-medium transition-all"
        >
          <Settings className="size-3.5" />
          Edit Permissions
        </button>
      </div>
    </div>
  )
}

// ─── Permissions Editor Modal ─────────────────────────────────────────────────
function PermissionsModal({
  role,
  permissions,
  assignedIds,
  saving,
  onToggle,
  onSave,
  onClose,
}: {
  role: Role
  permissions: Permission[]
  assignedIds: Set<number>
  saving: boolean
  onToggle: (id: number) => void
  onSave: () => void
  onClose: () => void
}) {
  // Group by feature
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = p.feature
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const features = Object.keys(grouped).sort()

  // For each feature, we want to show 4 action columns: Create, View, Edit, Delete
  // Find the permission with matching action for each feature
  const getPermission = (feature: string, actionType: ActionType): Permission | undefined => {
    const featurePerms = grouped[feature] || []
    return featurePerms.find(p => {
      const a = p.action.toLowerCase()
      const t = actionType.toLowerCase()
      return a === t || a.startsWith(t.slice(0, 4)) || a === (t === "create" ? "manage" : t)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Edit Role Permissions</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Managing access for: <span className="font-semibold text-[#1565c0]">{role.name}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_repeat(4,_52px)] px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Feature / Module</span>
          {ACTION_META.map(({ type, icon: Icon }) => (
            <div key={type} className="flex flex-col items-center gap-0.5">
              <Icon className="size-3.5 text-zinc-500" />
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{type}</span>
            </div>
          ))}
        </div>

        {/* Permissions grid */}
        <div className="overflow-y-auto flex-1">
          {features.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-sm">No permissions defined yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {features.map((feature, idx) => (
                <div
                  key={feature}
                  className={cn(
                    "grid grid-cols-[1fr_repeat(4,_52px)] items-center px-6 py-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors",
                    idx % 2 === 0 ? "" : "bg-zinc-50/40 dark:bg-zinc-900/20"
                  )}
                >
                  {/* Feature name */}
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {feature.replace(/_/g, " ")}
                  </span>

                  {/* Action toggle buttons */}
                  {ACTION_META.map(({ type, icon: Icon }) => {
                    const perm = getPermission(feature, type)
                    const active = perm ? assignedIds.has(perm.id) : false
                    return (
                      <div key={type} className="flex justify-center">
                        {perm ? (
                          <button
                            onClick={() => onToggle(perm.id)}
                            title={`${active ? "Revoke" : "Grant"} ${type} on ${feature}`}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 focus:outline-none",
                              active
                                ? "bg-[#1565c0] text-white shadow-md shadow-[#1565c0]/30 hover:bg-[#0a2744]"
                                : "border border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-[#1565c0] hover:text-[#1565c0] hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            )}
                          >
                            <Icon className="size-3.5" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center" title="Not defined">
                            <span className="text-[10px] text-zinc-300">—</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
          <span className="text-sm text-zinc-500">
            <span className="font-bold text-[#1565c0]">{assignedIds.size}</span> permissions granted
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-lg border border-zinc-200 dark:border-zinc-600 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-[#1565c0] hover:bg-[#0a2744] text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Name Edit Modal ──────────────────────────────────────────────────────────
function NameModal({
  mode,
  name,
  description,
  saving,
  onChange,
  onDescChange,
  onSave,
  onClose,
}: {
  mode: "add" | "edit"
  name: string
  description: string
  saving: boolean
  onChange: (v: string) => void
  onDescChange: (v: string) => void
  onSave: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            {mode === "add" ? "Add New Role" : "Edit Role Name"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1">Role Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => onChange(e.target.value)}
              placeholder="e.g. Manager, Inspector, Cashier"
              className="w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => onDescChange(e.target.value)}
              placeholder="Describe this role..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal resize-none text-foreground"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal text-zinc-600 hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-md bg-[#1565c0] hover:bg-[#0a2744] text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {mode === "add" ? "Create Role" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteModal({
  role,
  saving,
  onConfirm,
  onClose,
}: {
  role: Role
  saving: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Trash2 className="size-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">Delete Role?</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Are you sure you want to delete <strong className="text-foreground">"{role.name}"</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="h-10 px-5 rounded-md border border-zinc-200 text-sm font-normal text-zinc-600 hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="h-10 px-5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Assigned permissions per role (cache)
  const [assignedMap, setAssignedMap] = useState<Record<number, Set<number>>>({})
  const [loadingRoleId, setLoadingRoleId] = useState<number | null>(null)

  // Modals
  const [permModal, setPermModal] = useState<Role | null>(null)
  const [nameModal, setNameModal] = useState<{ mode: "add" | "edit"; role?: Role } | null>(null)
  const [deleteModal, setDeleteModal] = useState<Role | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  const loadBase = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesData, permsData] = await Promise.all([roleApi.getAll(), permissionApi.getAll()])
      setRoles(rolesData)
      setPermissions(permsData)
      // Load assignments for all roles
      const entries = await Promise.all(
        rolesData.map(async r => {
          const data = await rolePermissionApi.getByRole(r.id)
          return [r.id, new Set(data.map(a => a.permissionId))] as [number, Set<number>]
        })
      )
      setAssignedMap(Object.fromEntries(entries))
    } catch (err: any) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBase() }, [loadBase])

  // Toggle a permission for the currently open role
  const togglePermission = (permId: number) => {
    if (!permModal) return
    setAssignedMap(prev => {
      const current = new Set(prev[permModal.id] || [])
      if (current.has(permId)) current.delete(permId)
      else current.add(permId)
      return { ...prev, [permModal.id]: current }
    })
  }

  // Save permissions for the currently open role
  const handleSavePerms = async () => {
    if (!permModal) return
    setSaving(true)
    try {
      await rolePermissionApi.setForRole(permModal.id, Array.from(assignedMap[permModal.id] || new Set()))
      toast.success(`Permissions for "${permModal.name}" saved!`)
      setPermModal(null)
    } catch (err: any) {
      toast.error("Failed to save permissions")
    } finally {
      setSaving(false)
    }
  }

  // Create / Edit role name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameModal) return
    setSaving(true)
    try {
      if (nameModal.mode === "add") {
        const created = await roleApi.create({ name, description: desc || undefined })
        toast.success("Role created!")
        setAssignedMap(prev => ({ ...prev, [created.id]: new Set() }))
      } else if (nameModal.role) {
        await roleApi.update(nameModal.role.id, { name, description: desc || undefined })
        toast.success("Role updated!")
      }
      setNameModal(null)
      loadBase()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save role")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setSaving(true)
    try {
      await roleApi.delete(deleteModal.id)
      toast.success("Role deleted")
      setDeleteModal(null)
      loadBase()
    } catch (err: any) {
      toast.error("Failed to delete role")
    } finally {
      setSaving(false)
    }
  }

  const openAdd = () => { setName(""); setDesc(""); setNameModal({ mode: "add" }) }
  const openEditName = (r: Role) => { setName(r.name); setDesc(r.description || ""); setNameModal({ mode: "edit", role: r }) }

  return (
    <div className={cn(dashboardPageClass, "space-y-6")} style={dashboardPageStyle}>
      {/* Header */}
      <div className={cn(pageHeaderWrapperClass, "flex items-end justify-between")}>
        <div>
          <h1 className={pageHeaderTitleClass}>Roles & Permissions</h1>
          <p className={pageHeaderSubtitleClass}>Manage roles and assign access permissions</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="size-4" />
          Add New Role
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-7 animate-spin text-[#1565c0]" />
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm">No roles yet. Create your first role.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              permissions={permissions}
              assignedIds={assignedMap[role.id] || new Set()}
              onEditPermissions={setPermModal}
              onEditName={openEditName}
              onDelete={setDeleteModal}
            />
          ))}
        </div>
      )}

      {/* Permissions Modal */}
      {permModal && (
        <PermissionsModal
          role={permModal}
          permissions={permissions}
          assignedIds={assignedMap[permModal.id] || new Set()}
          saving={saving}
          onToggle={togglePermission}
          onSave={handleSavePerms}
          onClose={() => setPermModal(null)}
        />
      )}

      {/* Name (Add / Edit) Modal */}
      {nameModal && (
        <NameModal
          mode={nameModal.mode}
          name={name}
          description={desc}
          saving={saving}
          onChange={setName}
          onDescChange={setDesc}
          onSave={handleSaveName}
          onClose={() => setNameModal(null)}
        />
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteModal
          role={deleteModal}
          saving={saving}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </div>
  )
}
