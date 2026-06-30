"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { userApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  dashboardCardClass,
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderSubtitleClass,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-11 px-3 pr-10 rounded-lg border border-zinc-200 dark:border-border bg-white dark:bg-muted/20 text-sm text-foreground outline-none focus:border-[#1565c0] focus:ring-2 focus:ring-[#1565c0]/10"
const labelCls = "text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block"

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error("New password must be at least 6 characters")
    if (newPassword !== confirmPassword) return toast.error("Confirm password does not match")

    setSaving(true)
    try {
      await userApi.changePassword({ currentPassword, newPassword })
      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Change Password</h1>
        <p className={pageHeaderSubtitleClass}>Update your account password securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className={dashboardCardClass}>
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-border flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#1565c0] text-white flex items-center justify-center">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0a2744] dark:text-white">Security</h2>
              <p className="text-xs text-zinc-500">Enter current password before setting a new one.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-xl">
            <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
            <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew((v) => !v)} />
            <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />

            <Button type="submit" disabled={saving} className="h-11 bg-[#1565c0] hover:bg-[#0a2744] text-white">
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <ShieldCheck className="size-4 mr-2" />}
              Update Password
            </Button>
          </form>
        </div>

        <div className={cn(dashboardCardClass, "p-5 h-fit")}>
          <ShieldCheck className="size-8 text-[#1565c0] mb-3" />
          <h3 className="text-base font-bold text-[#0a2744] dark:text-white">Password Tips</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-500">
            <li>Use at least 6 characters.</li>
            <li>Use a mix of letters and numbers.</li>
            <li>Do not share your password.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={inputCls}
          placeholder={label}
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}
