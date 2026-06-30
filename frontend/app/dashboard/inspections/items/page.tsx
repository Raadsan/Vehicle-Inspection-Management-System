"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionTemplateItemApi, InspectionTemplateItem } from "@/lib/api"
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

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

export default function InspectionItemsPage() {
  const [items, setItems] = useState<InspectionTemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<InspectionTemplateItem | null>(null)
  const [name, setName] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await inspectionTemplateItemApi.getAll()
      setItems(data)
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => { setCurrentPage(1) }, [search])

  const resetForm = () => { setName(""); setSortOrder(0); setIsActive(true) }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Item name is required"); return }
    setSubmitting(true)
    try {
      await inspectionTemplateItemApi.create({ name: name.trim(), sortOrder })
      toast.success("Inspection item created")
      setIsAddOpen(false)
      loadData()
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !name.trim()) return
    setSubmitting(true)
    try {
      await inspectionTemplateItemApi.update(selected.id, { name: name.trim(), isActive, sortOrder })
      toast.success("Inspection item updated")
      setIsEditOpen(false)
      loadData()
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await inspectionTemplateItemApi.delete(selected.id)
      toast.success("Inspection item deleted")
      setIsDeleteOpen(false)
      loadData()
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const openAdd = () => { resetForm(); setIsAddOpen(true) }
  const openEdit = (item: InspectionTemplateItem) => {
    setSelected(item)
    setName(item.name)
    setSortOrder(item.sortOrder)
    setIsActive(item.isActive)
    setIsEditOpen(true)
  }

  const filtered = items.filter(item => {
    const s = search.toLowerCase()
    return item.name.toLowerCase().includes(s) || String(item.id).includes(s)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const statusBadge = (active: boolean) => {
    return (
      <span className={cn(
        dashboardStatusBadgeClass,
        active ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
      )}>
        {active ? "Active" : "Inactive"}
      </span>
    )
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Inspection Items</h1>
        <p className={pageHeaderSubtitleClass}>Manage inspection checklist items and templates</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium">Show</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
              className="h-9 px-2 border border-zinc-200 dark:border-border rounded bg-white dark:bg-muted/20 outline-none text-xs text-foreground">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground"
              />
            </div>
            <Button onClick={openAdd} className={dashboardAddButtonClass}>
              <Plus className="size-4" /><span>Create Inspection Item</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Item Name", "Sort Order", "Status", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading inspection items...</p>
                </TableCell></TableRow>
              ) : paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-semibold text-foreground">{row.name}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500 font-normal">{row.sortOrder}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>{statusBadge(row.isActive)}</TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-zinc-400 text-sm">No inspection items found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Create Inspection Item</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Add a new inspection checklist item.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div><label className={labelCls}>Item Name *</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Engine, Brakes, Lights..." className={inputCls} />
            </div>
            <div><label className={labelCls}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="0" className={inputCls} />
            </div>
            <DialogFooter className="pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit Inspection Item #{selected?.id}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Update inspection item details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div><label className={labelCls}>Item Name *</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div><label className={labelCls}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#1565c0]" />
              <label htmlFor="isActive" className="text-sm font-normal text-zinc-700 dark:text-zinc-300">Active</label>
            </div>
            <DialogFooter className="pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600">Delete Inspection Item?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-normal">Permanently remove inspection item "{selected?.name}".</DialogDescription>
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
