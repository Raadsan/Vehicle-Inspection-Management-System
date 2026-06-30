"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Edit2, Loader2, Lock, Mail, Phone, Save, Upload, UserCircle, X } from "lucide-react"
import toast from "react-hot-toast"
import { userApi, User } from "@/lib/api"
import { getStoredUser, type StoredUser } from "@/lib/auth"
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

const inputCls = "w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-border bg-white dark:bg-muted/20 text-sm text-foreground outline-none focus:border-[#1565c0] focus:ring-2 focus:ring-[#1565c0]/10"
const labelCls = "text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block"

function initials(user: StoredUser | User | null) {
  const name = user?.fullName || user?.username || "U"
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2)
}

export default function ProfilePage() {
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  const loadProfile = async () => {
    const user = getStoredUser()
    setStoredUser(user)
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await userApi.getById(user.id)
      setProfile(data)
      setUsername(data.username || "")
      setFullName(data.fullName || "")
      setEmail(data.email || "")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed to load profile: " + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => { loadProfile() }, 0)
    return () => window.clearTimeout(id)
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const updated = await userApi.update(profile.id, { username, fullName, email })
      setProfile(updated)
      const merged = {
        ...(storedUser || {}),
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
      } as StoredUser
      localStorage.setItem("user", JSON.stringify(merged))
      setStoredUser(merged)
      setEditing(false)
      toast.success("Profile updated")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file?: File) => {
    if (!profile || !file) return
    setUploadingAvatar(true)
    try {
      const updated = await userApi.uploadAvatar(profile.id, file)
      setProfile(updated)
      const merged = {
        ...(storedUser || {}),
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
      } as StoredUser
      localStorage.setItem("user", JSON.stringify(merged))
      setStoredUser(merged)
      toast.success("Profile image updated")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Upload failed: " + (e.response?.data?.error || e.message))
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Profile</h1>
        <p className={pageHeaderSubtitleClass}>Manage your account profile and details</p>
      </div>

      <div className={dashboardCardClass}>
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="size-7 animate-spin mx-auto text-primary" />
          </div>
        ) : profile ? (
          <>
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-muted/30 flex items-center justify-center text-zinc-500">
                  <UserCircle className="size-5" />
                </div>
                <h2 className="text-base font-bold text-[#0a2744] dark:text-white">Profile Details</h2>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <Button variant="outline" disabled={saving} onClick={() => { setEditing(false); setUsername(profile.username || ""); setFullName(profile.fullName || ""); setEmail(profile.email || "") }}>
                    <X className="size-4 mr-2" /> Cancel
                  </Button>
                  <Button disabled={saving} className="bg-[#1565c0] hover:bg-[#0a2744] text-white" onClick={handleSave}>
                    {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                    Save
                  </Button>
                </div>
              ) : (
                <Button className="bg-[#1565c0] hover:bg-[#0a2744] text-white" onClick={() => setEditing(true)}>
                  <Edit2 className="size-4 mr-2" /> Edit
                </Button>
              )}
            </div>

            <div className="px-6 py-6 border-b border-zinc-100 dark:border-border flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <label className="relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                  />
                  <div className="size-28 rounded-full bg-gradient-to-br from-[#22c55e] to-[#3b82f6] border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-white">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt={profile.fullName || profile.username} width={112} height={112} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      initials(profile)
                    )}
                  </div>
                  <span className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar ? <Loader2 className="size-6 animate-spin text-white" /> : <Upload className="size-6 text-white" />}
                  </span>
                </label>
                <p className="text-xs font-semibold text-[#1565c0]">Upload image</p>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  {editing ? (
                    <input className={cn(inputCls, "max-w-md h-11 text-lg font-bold")} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                  ) : (
                    <h3 className="text-2xl font-bold text-[#0a2744] dark:text-white">{profile.fullName || profile.username}</h3>
                  )}
                  <span className="inline-flex mt-2 px-2.5 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                  <div>
                    <label className={labelCls}>Username</label>
                    {editing ? <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" /> : <p className="text-sm font-semibold text-foreground">{profile.username}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    {editing ? <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /> : <p className="text-sm font-semibold text-foreground">{profile.email || "—"}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Role</label>
                    <p className="text-sm font-semibold text-foreground">{profile.role}</p>
                  </div>
                  <div>
                    <label className={labelCls}>Company</label>
                    <p className="text-sm font-semibold text-foreground">{profile.company?.name || storedUser?.companyName || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-zinc-50/60 dark:bg-muted/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#0a2744] dark:text-white flex items-center gap-2"><Lock className="size-4" /> Security</p>
                <p className="text-xs text-zinc-500 mt-1">Update your password from the secure change-password page.</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/dashboard/change-password">Change Password</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-sm text-muted-foreground">No profile found</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cn(dashboardCardClass, "p-5")}>
          <Mail className="size-5 text-[#1565c0] mb-3" />
          <p className="text-sm font-bold text-[#0a2744] dark:text-white">Email</p>
          <p className="text-sm text-zinc-500 mt-1">{profile?.email || "No email saved"}</p>
        </div>
        <div className={cn(dashboardCardClass, "p-5")}>
          <Phone className="size-5 text-[#1565c0] mb-3" />
          <p className="text-sm font-bold text-[#0a2744] dark:text-white">Contact</p>
          <p className="text-sm text-zinc-500 mt-1">Use company profile details for phone/contact changes.</p>
        </div>
      </div>
    </div>
  )
}
