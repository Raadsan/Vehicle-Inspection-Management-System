"use client"

import React from "react"
import { Edit, Eye, Loader2, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getAllPermissionPages,
  PERMISSION_ACTIONS,
  toModuleLabel,
  type PermissionAction,
  type RolePermissionMap,
} from "@/lib/navigation-config"
import type { Role } from "@/lib/api"

/** Same icons used across Roles / Users tables */
const ACTION_ICONS: Record<PermissionAction, React.ElementType> = {
  add: Plus,
  view: Eye,
  edit: Edit,
  delete: Trash2,
}

interface RolePermissionsEditorProps {
  role: Role
  permissions: RolePermissionMap
  saving?: boolean
  onToggle: (pageKey: string, action: PermissionAction) => void
  onSetAll: (granted: boolean) => void
  onSave: () => void
  onClose: () => void
}

function PermissionRow({
  label,
  row,
  onToggle,
}: {
  label: string
  row: { view: boolean; add: boolean; edit: boolean; delete: boolean }
  onToggle: (action: PermissionAction) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-card border border-zinc-200 dark:border-zinc-700 rounded-lg min-h-[52px]">
      <span className="text-sm font-normal text-zinc-800 dark:text-zinc-200 truncate">{label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {PERMISSION_ACTIONS.map(({ key }) => {
          const Icon = ACTION_ICONS[key]
          const active = row[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center transition-all",
                active
                  ? "bg-[#1565c0] text-white hover:bg-[#0a2744]"
                  : "bg-white dark:bg-zinc-900 border border-[#1565c0]/40 text-[#1565c0] hover:bg-[#1565c0]/5"
              )}
            >
              <Icon className="size-3.5" strokeWidth={2} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function RolePermissionsEditor({
  role,
  permissions,
  saving,
  onToggle,
  onSetAll,
  onSave,
  onClose,
}: RolePermissionsEditorProps) {
  const pages = getAllPermissionPages()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="bg-[#f8fafc] dark:bg-[#1a1f2e] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-700">
        {/* Header — matches reference */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1a1f2e] border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit Role</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Role Access
              <span className="font-normal text-zinc-400 ml-2">— {role.name}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetAll(true)}
                className="h-8 px-3 rounded-md bg-[#1565c0] text-white text-xs font-semibold hover:bg-[#0a2744] transition-colors"
              >
                Check all
              </button>
              <button
                type="button"
                onClick={() => onSetAll(false)}
                className="h-8 px-3 rounded-md border border-zinc-300 dark:border-zinc-600 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Two-column card grid — no table header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pages.map((page) => {
              const row = permissions[page.key] || {
                view: false,
                add: false,
                edit: false,
                delete: false,
              }
              return (
                <PermissionRow
                  key={page.key}
                  label={toModuleLabel(page)}
                  row={row}
                  onToggle={(action) => onToggle(page.key, action)}
                />
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white dark:bg-[#1a1f2e] border-t border-zinc-200 dark:border-zinc-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-md border border-zinc-300 dark:border-zinc-600 text-sm font-normal text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-10 px-6 rounded-md bg-[#1565c0] hover:bg-[#0a2744] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
