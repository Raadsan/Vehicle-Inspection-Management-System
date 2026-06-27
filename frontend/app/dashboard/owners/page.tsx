"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Eye, Trash2, Loader2, UserCircle } from "lucide-react"
import toast from "react-hot-toast"
import { ownerApi, Owner } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [companyId, setCompanyId] = useState<number>(1)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Owner | null>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [address, setAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try { setOwners(await ownerApi.getAll()) }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user.companyId) setCompanyId(Number(user.companyId))
    }
    loadData()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try { await ownerApi.create({ companyId, fullName, phone: phone || undefined, email: email || undefined, nationalId: nationalId || undefined, address: address || undefined }); toast.success("Owner registered"); setIsAddOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSubmitting(true)
    try { await ownerApi.update(selected.id, { fullName, phone: phone || undefined, email: email || undefined, nationalId: nationalId || undefined, address: address || undefined }); toast.success("Owner updated"); setIsEditOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try { await ownerApi.delete(selected.id); toast.success("Owner deleted"); setIsDeleteOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const openAdd = () => { setFullName(""); setPhone(""); setEmail(""); setNationalId(""); setAddress(""); setIsAddOpen(true) }
  const openEdit = (o: Owner) => { setSelected(o); setFullName(o.fullName); setPhone(o.phone || ""); setEmail(o.email || ""); setNationalId(o.nationalId || ""); setAddress(o.address || ""); setIsEditOpen(true) }
  const filtered = owners.filter(o => o.fullName.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search) || o.email?.toLowerCase().includes(search.toLowerCase()) || o.nationalId?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vehicle Owners</h1>
        <p className={pageHeaderSubtitleClass}>Manage registered vehicle owners</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">{filtered.length} of {owners.length} owners</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search owners..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" />
            </div>
            <Button onClick={openAdd} className="h-10 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold px-5 rounded-md flex items-center gap-2 shadow-sm text-sm">
              <Plus className="size-4.5" /><span>Add Owner</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["#", "Full Name", "Phone", "Email", "National ID", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading owners...</p>
                </TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{idx + 1}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-semibold text-foreground flex items-center gap-1.5"><UserCircle className="size-4 text-[#1565c0] shrink-0" />{row.fullName}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 dark:text-zinc-400 font-normal">{row.phone || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500 font-normal">{row.email || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-mono text-zinc-600">{row.nationalId || "—"}</span></TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-zinc-400 text-sm">No owners found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Register New Owner</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Add a vehicle owner record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className={labelCls}>Full Name *</label><input required type="text" placeholder="Owner full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Phone</label><input type="text" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>National ID</label><input type="text" placeholder="National ID" value={nationalId} onChange={(e) => setNationalId(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Email</label><input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Physical address..."
                className="w-full h-16 px-3 py-2.5 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal resize-none" />
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Register Owner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit Owner</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Update owner contact details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className={labelCls}>Full Name *</label><input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>National ID</label><input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full h-16 px-3 py-2.5 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal resize-none" />
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4"><DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Owner Profile</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[["Full Name", selected.fullName], ["Phone", selected.phone || "—"], ["Email", selected.email || "—"], ["National ID", selected.nationalId || "—"], ["Address", selected.address || "—"]].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                  <span className="text-sm text-zinc-400 font-normal shrink-0">{l}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-end"><Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600">Delete Owner?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-normal">This will permanently remove this owner record.</DialogDescription>
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
