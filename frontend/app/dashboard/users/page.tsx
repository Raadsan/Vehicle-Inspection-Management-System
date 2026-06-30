"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Search, Plus, Edit, Eye, Trash2, Loader2, Upload } from "lucide-react"
import toast from "react-hot-toast"
import { userApi, roleApi, User, Role } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, dashboardAddButtonClass,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

function getErrorMessage(err: unknown) {
  const e = err as { response?: { data?: { error?: string } }; message?: string }
  return e.response?.data?.error || e.message || "Unknown error"
}

function getInitials(user: User) {
  return (user.fullName || user.username || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function UserAvatar({ user, className = "size-9" }: { user: User; className?: string }) {
  return (
    <div className={cn(className, "rounded-full overflow-hidden bg-gradient-to-br from-[#22c55e] to-[#3b82f6] text-white font-bold flex items-center justify-center shrink-0")}>
      {user.avatarUrl ? <Image src={user.avatarUrl} alt={user.fullName || user.username} width={64} height={64} className="w-full h-full object-cover" unoptimized /> : getInitials(user)}
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [roleId, setRoleId] = useState<number | "">("")
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([userApi.getAll(), roleApi.getAll()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err: unknown) {
      toast.error("Failed to load: " + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => { loadData() }, 0)
    return () => window.clearTimeout(id)
  }, [])
  useEffect(() => {
    const id = window.setTimeout(() => { setCurrentPage(1) }, 0)
    return () => window.clearTimeout(id)
  }, [search, roleFilter])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) return toast.error("Please select a role")
    setSubmitting(true)

    // Map system role based on selected custom role name
    const chosenRole = roles.find(r => r.id === Number(roleId))
    let systemRole: User["role"] = "STAFF"
    if (chosenRole?.name.toLowerCase().includes("owner")) systemRole = "OWNER"
    if (chosenRole?.name.toLowerCase().includes("inspector")) systemRole = "INSPECTOR"
    if (chosenRole?.name.toLowerCase().includes("admin")) systemRole = "SUPER_ADMIN"

    try {
      await userApi.create({
        username,
        password,
        email: email || undefined,
        fullName: fullName || undefined,
        role: systemRole,
        roleId: Number(roleId),
        isActive
      })
      toast.success("User created"); setIsAddOpen(false); loadData()
    } catch (err: unknown) { toast.error("Failed: " + getErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return;
    if (!roleId) return toast.error("Please select a role")
    setSubmitting(true)

    const chosenRole = roles.find(r => r.id === Number(roleId))
    let systemRole: User["role"] = "STAFF"
    if (chosenRole?.name.toLowerCase().includes("owner")) systemRole = "OWNER"
    if (chosenRole?.name.toLowerCase().includes("inspector")) systemRole = "INSPECTOR"
    if (chosenRole?.name.toLowerCase().includes("admin")) systemRole = "SUPER_ADMIN"

    try {
      const payload: Partial<User> & { password?: string; roleId?: number } = {
        username, email: email || undefined, fullName: fullName || undefined, role: systemRole, roleId: Number(roleId), isActive
      }
      if (password) payload.password = password
      await userApi.update(selected.id, payload)
      toast.success("User updated"); setIsEditOpen(false); loadData()
    } catch (err: unknown) { toast.error("Failed: " + getErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try {
      await userApi.delete(selected.id); toast.success("User deleted"); setIsDeleteOpen(false); loadData()
    } catch (err: unknown) { toast.error("Failed: " + getErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleAvatarUpload = async (file?: File) => {
    if (!selected || !file) return
    setUploadingAvatar(true)
    try {
      const updated = await userApi.uploadAvatar(selected.id, file)
      setSelected(updated)
      setUsers((prev) => prev.map((user) => user.id === updated.id ? updated : user))
      toast.success("User image updated")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Upload failed: " + (e.response?.data?.error || e.message))
    } finally {
      setUploadingAvatar(false)
    }
  }

  const openAdd = () => {
    setUsername(""); setPassword(""); setEmail(""); setFullName("")
    setRoleId(roles[0]?.id || ""); setIsActive(true); setIsAddOpen(true)
  }
  const openEdit = (u: User) => {
    setSelected(u); setUsername(u.username); setPassword(""); setEmail(u.email || "")
    setFullName(u.fullName || ""); setRoleId(u.roleId || ""); setIsActive(u.isActive); setIsEditOpen(true)
  }

  const filtered = users.filter((u) => {
    const s = search.toLowerCase()
    const matchSearch = u.username.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.fullName?.toLowerCase().includes(s)
    if (!matchSearch) return false
    if (!roleFilter) return true
    // Filter by DB role id
    return String(u.roleId) === String(roleFilter)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)


  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Users</h1>
        <p className={pageHeaderSubtitleClass}>Manage system users and their roles</p>
      </div>

      <div className={dashboardCardClass}>
        {/* Filters row */}
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium">Show</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                className="h-9 px-2 border border-zinc-200 dark:border-border rounded bg-white dark:bg-muted/20 outline-none text-xs text-foreground">
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 border border-zinc-200 dark:border-border rounded text-xs bg-white dark:bg-muted/20 outline-none text-foreground font-sans">
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" />
            </div>
            <Button onClick={openAdd} className={dashboardAddButtonClass}>
              <Plus className="size-4" /><span>Add User</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Username", "Full Name", "Email", "Role", "Status", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading users...</p>
                </TableCell></TableRow>
              ) : paginatedData.length > 0 ? paginatedData.map((row, idx) => {
                const customRole = row.roleId ? roles.find(r => r.id === row.roleId) : null
                return (
                  <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={row} />
                        <span className="text-sm font-semibold text-foreground">{row.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">{row.fullName || "—"}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-500">{row.email || "—"}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      {customRole ? (
                        <span className={cn(dashboardStatusBadgeClass, "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300")}>
                          {customRole.name}
                        </span>
                      ) : <span className="text-zinc-400 text-sm">—</span>}
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={cn(dashboardStatusBadgeClass, row.isActive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                        {row.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-zinc-400 text-sm">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-5 py-4 border-t border-zinc-100 dark:border-border flex items-center justify-between select-none">
            <div className="text-xs text-zinc-500 font-medium">
              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 p-0">
                <span className="text-xs font-semibold">&lt;</span>
              </Button>
              <span className="text-xs font-bold px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                {currentPage} of {totalPages || 1}
              </span>
              <Button variant="outline" size="icon" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 p-0">
                <span className="text-xs font-semibold">&gt;</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Add New User</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">Create a new system user account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 py-2">
            <div><label className={labelCls}>Username *</label><input required type="text" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Password *</label><input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Full Name</label><input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Email</label><input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2">
              <label className={labelCls}>Role *</label>
              <select
                required
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className={selectCls}
              >
                <option value="" disabled>— Select Role —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2.5 pt-1">
              <input type="checkbox" id="ua" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="size-4 rounded" />
              <label htmlFor="ua" className="text-sm font-normal text-zinc-700 dark:text-zinc-300">Active account</label>
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT MODAL ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit User</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">Update user account details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 py-2">
            {selected && (
              <div className="col-span-2 flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-border bg-zinc-50/70 dark:bg-muted/10 p-4">
                <UserAvatar user={selected} className="size-16" />
                <div>
                  <p className="text-sm font-bold text-[#0a2744] dark:text-white">Profile Image</p>
                  <p className="text-xs text-zinc-500 mb-2">Admin can change this user profile photo.</p>
                  <label className="inline-flex h-9 px-3 rounded-md border border-zinc-200 dark:border-border bg-white dark:bg-card text-xs font-bold uppercase tracking-wider items-center gap-2 cursor-pointer hover:bg-zinc-50">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                    {uploadingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    Upload Image
                  </label>
                </div>
              </div>
            )}
            <div><label className={labelCls}>Username *</label><input required type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>New Password <span className="text-zinc-400 font-normal text-xs">(blank = keep)</span></label><input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Full Name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2">
              <label className={labelCls}>Role *</label>
              <select
                required
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className={selectCls}
              >
                <option value="" disabled>— Select Role —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2.5 pt-1">
              <input type="checkbox" id="ue" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="size-4 rounded" />
              <label htmlFor="ue" className="text-sm font-normal text-zinc-700 dark:text-zinc-300">Active account</label>
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VIEW MODAL ── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">User Details</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const customRole = selected.roleId ? roles.find(r => r.id === selected.roleId) : null
            return (
              <div className="space-y-3">
                <div className="flex justify-center pb-2">
                  <UserAvatar user={selected} className="size-20 text-xl" />
                </div>
                {[
                  ["Username", selected.username],
                  ["Full Name", selected.fullName || "—"],
                  ["Email", selected.email || "—"],
                  ["Role", customRole?.name || "—"],
                  ["Status", selected.isActive ? "Active" : "Inactive"],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                    <span className="text-sm text-zinc-400 shrink-0">{l}</span>
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-end">
                  <Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ── DELETE MODAL ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600">Delete User?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
            <Button onClick={handleDelete} disabled={submitting} className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md text-sm flex items-center gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
