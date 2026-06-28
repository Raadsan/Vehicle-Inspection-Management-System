"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Eye, Trash2, Loader2, Building2, EyeOff } from "lucide-react"
import toast from "react-hot-toast"
import { companyApi, Company } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addAddress, setAddAddress] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selected, setSelected] = useState<Company | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editActive, setEditActive] = useState(true)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // View modal
  const [isViewOpen, setIsViewOpen] = useState(false)

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try { setCompanies(await companyApi.getAll()) }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const resetAdd = () => { setAddName(""); setAddEmail(""); setAddPhone(""); setAddAddress(""); setAddPassword("") }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName.trim()) return toast.error("Company name is required")
    if (!addPassword.trim()) return toast.error("Owner password is required")
    setAddSubmitting(true)
    try {
      const res = await companyApi.create({ name: addName, email: addEmail || undefined, phone: addPhone || undefined, address: addAddress || undefined, ownerPassword: addPassword })
      const username = res.users?.[0]?.username || addName.toLowerCase().replace(/\s+/g, "_")
      toast.success(`Company created! Login: ${username}`)
      setIsAddOpen(false); resetAdd(); loadData()
    }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setAddSubmitting(false) }
  }

  const openEdit = (c: Company) => {
    setSelected(c); setEditName(c.name); setEditEmail(c.email || ""); setEditPhone(c.phone || ""); setEditAddress(c.address || ""); setEditActive(c.isActive); setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setEditSubmitting(true)
    try {
      await companyApi.update(selected.id, { name: editName, email: editEmail || undefined, phone: editPhone || undefined, address: editAddress || undefined, isActive: editActive })
      toast.success("Company updated"); setIsEditOpen(false); loadData()
    }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setEditSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setDeleteSubmitting(true)
    try { await companyApi.delete(selected.id); toast.success("Company deleted"); setIsDeleteOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setDeleteSubmitting(false) }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Companies</h1>
        <p className={pageHeaderSubtitleClass}>Manage inspection companies and their owner accounts</p>
      </div>

      <div className={dashboardCardClass}>
        {/* ── Toolbar ── */}
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">{filtered.length} of {companies.length} companies</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search by name or email..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-60 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" />
            </div>
            <Button onClick={() => { resetAdd(); setIsAddOpen(true) }}
              className="h-10 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold px-5 rounded-md flex items-center gap-2 shadow-sm text-sm">
              <Plus className="size-4.5" /><span>Add Company</span>
            </Button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["#", "Company", "Contact", "Login Username", "Vehicles", "Inspections", "Status", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground font-medium mt-2">Loading companies...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? filtered.map((row) => {
                const ownerUser = row.users?.find(u => u.role === "OWNER") || row.users?.[0]
                return (
                  <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>#{row.id}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Building2 className="size-4 text-[#1565c0] shrink-0" />
                        {row.name}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 font-normal">{row.email || "—"}</p>
                        <p className="text-xs text-zinc-400">{row.phone || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      {ownerUser ? (
                        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded">
                          {ownerUser.username}
                        </span>
                      ) : <span className="text-zinc-400 text-sm">—</span>}
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-semibold text-foreground">{row._count?.vehicles ?? "—"}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-semibold text-foreground">{row._count?.inspections ?? "—"}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={cn(dashboardStatusBadgeClass, row.isActive ? "bg-emerald-600 text-white" : "bg-zinc-400 text-white")}>
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }}
                          className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }}
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-zinc-400 text-sm">No companies found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Add Modal ─── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Add New Company</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">
              A company owner login account will be auto-created using the company name as username.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <label className={labelCls}>Company Name *</label>
              <input required value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. Toyota Kenya Ltd" className={inputCls} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="info@company.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="+254 700 000000" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address</label>
              <input value={addAddress} onChange={e => setAddAddress(e.target.value)} placeholder="Company address" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Owner Password *</label>
              <div className="relative">
                <input required type={showPass ? "text" : "password"} value={addPassword} onChange={e => setAddPassword(e.target.value)} placeholder="Set a login password for the owner account" className={inputCls + " pr-10"} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {addName && (
                <p className="text-xs text-zinc-400 mt-1">
                  Login username will be: <code className="bg-zinc-100 px-1 rounded text-[#1565c0]">{addName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}</code>
                </p>
              )}
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={addSubmitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {addSubmitting && <Loader2 className="size-4 animate-spin" />}Create Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Modal ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit Company</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Update company information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <label className={labelCls}>Company Name *</label>
              <input required value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address</label>
              <input value={editAddress} onChange={e => setEditAddress(e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} className="w-4 h-4 rounded text-[#1565c0]" />
                <span className="text-sm font-semibold text-[#0a2744] dark:text-zinc-300">Company is Active</span>
              </label>
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={editSubmitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {editSubmitting && <Loader2 className="size-4 animate-spin" />}Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── View Modal ─── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[
                ["Email", selected.email || "—"],
                ["Phone", selected.phone || "—"],
                ["Address", selected.address || "—"],
                ["Status", selected.isActive ? "Active" : "Inactive"],
                ["Vehicles", String(selected._count?.vehicles ?? "—")],
                ["Inspections", String(selected._count?.inspections ?? "—")],
                ["Inspectors", String(selected._count?.inspectors ?? "—")],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                  <span className="text-sm text-zinc-400 font-normal shrink-0">{l}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                </div>
              ))}
              {selected.users && selected.users.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Login Accounts</p>
                  {selected.users.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-zinc-50 dark:border-border">
                      <code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-[#1565c0] px-2 py-0.5 rounded">{u.username}</code>
                      <span className="text-xs text-zinc-400 font-semibold">{u.role}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Modal ─── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600">Delete Company?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-normal">
              Permanently remove <strong>"{selected?.name}"</strong>. All associated users and data may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
            <Button onClick={handleDelete} disabled={deleteSubmitting} className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md text-sm flex items-center gap-2">
              {deleteSubmitting && <Loader2 className="size-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
