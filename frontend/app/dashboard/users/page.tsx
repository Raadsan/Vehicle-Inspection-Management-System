"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Eye, Trash2, Loader2, Users as UsersIcon } from "lucide-react"
import toast from "react-hot-toast"
import { userApi, User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, formatStatusLabel,
} from "@/lib/dashboard-ui"

const ROLES = ["SUPER_ADMIN", "OWNER", "INSPECTOR", "STAFF"] as const
const roleBadge: Record<string, string> = {
  SUPER_ADMIN: "bg-[#0a2744] text-white",
  OWNER: "bg-[#1565c0] text-white",
  INSPECTOR: "bg-[#2196f3] text-white",
  STAFF: "bg-[#4fc3f7] text-[#0a2744]",
}

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
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
  const [role, setRole] = useState<User["role"]>("STAFF")
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try { setUsers(await userApi.getAll()) }
    catch (err: any) { toast.error("Failed to load users: " + (err.response?.data?.error || err.message)) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await userApi.create({ username, password, email: email || undefined, fullName: fullName || undefined, role, isActive })
      toast.success("User created"); setIsAddOpen(false); loadData()
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSubmitting(true)
    try {
      const payload: Partial<User> = { username, email: email || undefined, fullName: fullName || undefined, role, isActive }
      if (password) (payload as any).password = password
      await userApi.update(selected.id, payload)
      toast.success("User updated"); setIsEditOpen(false); loadData()
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try {
      await userApi.delete(selected.id); toast.success("User deleted"); setIsDeleteOpen(false); loadData()
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const openAdd = () => { setUsername(""); setPassword(""); setEmail(""); setFullName(""); setRole("STAFF"); setIsActive(true); setIsAddOpen(true) }
  const openEdit = (u: User) => { setSelected(u); setUsername(u.username); setPassword(""); setEmail(u.email || ""); setFullName(u.fullName || ""); setRole(u.role); setIsActive(u.isActive); setIsEditOpen(true) }

  const filtered = users.filter((u) => {
    const s = search.toLowerCase()
    const ms = u.username.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.fullName?.toLowerCase().includes(s)
    return ms && (roleFilter ? u.role === roleFilter : true)
  })

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Users</h1>
        <p className={pageHeaderSubtitleClass}>Manage system users and their roles</p>
      </div>

      <div className={dashboardCardClass}>
        {/* Controls: count left — filter + search + add button right */}
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">
            {filtered.length} of {users.length} users
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 border border-zinc-200 dark:border-border rounded-md text-sm font-normal bg-white dark:bg-muted/20 focus:border-[#1565c0] outline-none text-foreground">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{formatStatusLabel(r)}</option>)}
            </select>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search users..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" />
            </div>
            <Button onClick={openAdd} className="h-10 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold px-5 rounded-md flex items-center gap-2 shadow-sm text-sm">
              <Plus className="size-4.5" /><span>Add User</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["#", "Username", "Full Name", "Email", "Role", "Status", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading users...</p>
                </TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{idx + 1}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-semibold text-foreground flex items-center gap-1.5"><UsersIcon className="size-4 text-[#1565c0] shrink-0" />{row.username}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal">{row.fullName || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500">{row.email || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, roleBadge[row.role] || "bg-zinc-200 text-zinc-700")}>{row.role.replace("_", " ")}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, row.isActive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>{row.isActive ? "Active" : "Inactive"}</span></TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-zinc-400 text-sm">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ADD */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Add New User</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Create a new system user account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 py-2">
            <div><label className={labelCls}>Username *</label><input required type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Password *</label><input required type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Full Name</label><input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Email</label><input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as User["role"])} className={selectCls}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2.5 pt-1">
              <input type="checkbox" id="ua" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
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

      {/* EDIT */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit User</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Update user account details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 py-2">
            <div><label className={labelCls}>Username *</label><input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>New Password <span className="text-zinc-400 font-normal text-xs">(blank = keep current)</span></label><input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as User["role"])} className={selectCls}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2.5 pt-1">
              <input type="checkbox" id="ue" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
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

      {/* VIEW */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">User Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[["Username", selected.username], ["Full Name", selected.fullName || "—"], ["Email", selected.email || "—"], ["Role", selected.role.replace("_", " ")], ["Status", selected.isActive ? "Active" : "Inactive"]].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                  <span className="text-sm text-zinc-400 font-normal shrink-0">{l}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-end">
                <Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600">Delete User?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-normal">This action is permanent and cannot be undone.</DialogDescription>
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
