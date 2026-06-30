"use client"

import React, { useState, useEffect } from "react"
import { Search, Eye, Edit, CheckCircle, XCircle, Loader2, ClipboardCheck } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, Inspection } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass,
  formatStatusLabel,
  formatInspectionCreator,
  getInspectionInspectorDisplay,
  getOrderStatusBadgeClass,
  getVehicleBrand, getVehicleModelName, getVehicleColor, getVehicleYear, resolveVehicleOwner,
} from "@/lib/dashboard-ui"

const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"
const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const textareaCls = "w-full min-h-20 px-3 py-2 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground resize-y"

export default function AwaitingApprovalPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)
  const [viewDetail, setViewDetail] = useState<Inspection | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [actionNotes, setActionNotes] = useState("")
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [editScheduledAt, setEditScheduledAt] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const all = await inspectionApi.getAll()
      setInspections(all.filter((i: Inspection) => i.status === "AWAITING_APPROVAL"))
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (ax.response?.data?.error || ax.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { setCurrentPage(1) }, [search])

  const openView = async (row: Inspection) => {
    setSelected(row)
    setIsViewOpen(true)
    setViewLoading(true)
    try {
      setViewDetail(await inspectionApi.getById(row.id))
    } catch {
      setViewDetail(row)
    } finally {
      setViewLoading(false)
    }
  }

  const openAction = (row: Inspection) => {
    setSelected(row)
    setActionNotes("")
    setActionType(null)
    setIsActionOpen(true)
  }

  const openEdit = (row: Inspection) => {
    setSelected(row)
    setEditScheduledAt(row.scheduledAt ? row.scheduledAt.slice(0, 16) : "")
    setEditNotes(row.notes || "")
    setIsEditOpen(true)
  }

  const handleApprove = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await inspectionApi.approve(selected.id, { notes: actionNotes || undefined })
      toast.success("Inspection approved — moved to Approved list")
      setIsActionOpen(false)
      setActionNotes("")
      loadData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (ax.response?.data?.error || ax.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await inspectionApi.reject(selected.id, { notes: actionNotes || undefined })
      toast.success("Inspection rejected")
      setIsActionOpen(false)
      setActionNotes("")
      loadData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (ax.response?.data?.error || ax.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      await inspectionApi.update(selected.id, {
        scheduledAt: editScheduledAt || undefined,
        notes: editNotes || undefined,
      })
      toast.success("Inspection updated")
      setIsEditOpen(false)
      loadData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (ax.response?.data?.error || ax.message))
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = inspections.filter(i => {
    const s = search.toLowerCase()
    const creator = formatInspectionCreator(i.createdByUser).toLowerCase()
    return (i.vehicle?.plateNumber || "").toLowerCase().includes(s) ||
      creator.includes(s) ||
      (i.company?.name || "").toLowerCase().includes(s) ||
      String(i.id).includes(s)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <ClipboardCheck className="size-5 text-amber-600" />
          </div>
          <div>
            <h1 className={pageHeaderTitleClass}>Awaiting Approval</h1>
            <p className={pageHeaderSubtitleClass}>Click Pending status to approve or reject an inspection</p>
          </div>
        </div>
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
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder="Search plate, inspector..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Vehicle", "Inspector", "Scheduled", "Result", "Status", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </TableCell></TableRow>
              ) : paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.vehicle?.plateNumber || `#${row.vehicleId}`}</p>
                      {row.vehicle?.model && (
                        <p className="text-xs text-zinc-400">{(row.vehicle.model as { brand?: { name?: string }; name?: string }).brand?.name} {row.vehicle.model.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    {(() => {
                      const inspector = getInspectionInspectorDisplay(row.createdByUser, row.company)
                      return (
                        <div>
                          <span className="text-sm font-semibold text-foreground block">{inspector.primary}</span>
                          {inspector.secondary && (
                            <span className="text-xs text-zinc-400">{inspector.secondary}</span>
                          )}
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-500">{row.scheduledAt ? new Date(row.scheduledAt).toLocaleDateString() : "—"}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    {row.overallResult ? (
                      <span className={cn(dashboardStatusBadgeClass,
                        row.overallResult === "PASS" ? "bg-emerald-600 text-white" :
                        row.overallResult === "FAIL" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                      )}>{row.overallResult}</span>
                    ) : <span className="text-zinc-400 text-sm">—</span>}
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <button
                      type="button"
                      onClick={() => openAction(row)}
                      className={cn(dashboardStatusBadgeClass, "bg-amber-500 text-white cursor-pointer hover:bg-amber-600 transition-colors")}
                      title="Click to approve or reject"
                    >
                      Pending
                    </button>
                  </TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(row)}
                        className="h-8 w-8 text-primary hover:bg-primary/5 rounded" title="View">
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded" title="Edit">
                        <Edit className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <ClipboardCheck className="size-10 mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400 font-medium">No inspections awaiting approval</p>
                  </TableCell>
                </TableRow>
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
              <Button variant="outline" size="icon" disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 p-0">
                <span className="text-xs font-semibold">&lt;</span>
              </Button>
              <span className="text-xs font-bold px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                {currentPage} of {totalPages || 1}
              </span>
              <Button variant="outline" size="icon" disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 p-0">
                <span className="text-xs font-semibold">&gt;</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { setIsViewOpen(open); if (!open) setViewDetail(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Inspection #{selected?.id}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">Full inspection report</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[
                ["Vehicle", selected.vehicle?.plateNumber || `#${selected.vehicleId}`],
                ["Brand", getVehicleBrand(viewDetail?.vehicle || selected.vehicle)],
                ["Model", getVehicleModelName(viewDetail?.vehicle || selected.vehicle)],
                ["Color", getVehicleColor(viewDetail?.vehicle || selected.vehicle)],
                ["Year", getVehicleYear(viewDetail?.vehicle || selected.vehicle)],
                ["Company", selected.company?.name || "—"],
                ["Inspector", formatInspectionCreator(viewDetail?.createdByUser || selected.createdByUser)],
                ["Owner", resolveVehicleOwner(viewDetail?.vehicle || selected.vehicle)?.fullName || "—"],
                ["Owner Phone", resolveVehicleOwner(viewDetail?.vehicle || selected.vehicle)?.phone || "—"],
                ["Scheduled At", selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : "—"],
                ["Completed At", viewDetail?.completedAt ? new Date(viewDetail.completedAt).toLocaleString() : selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "—"],
                ["Status", formatStatusLabel(selected.status)],
                ["Overall Result", selected.overallResult || "—"],
                ["Notes", selected.notes || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                  <span className="text-sm text-zinc-400 shrink-0">{l}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                </div>
              ))}
              {viewLoading ? (
                <div className="py-6 text-center"><Loader2 className="size-5 animate-spin mx-auto text-primary" /></div>
              ) : viewDetail?.inspectionItems && viewDetail.inspectionItems.length > 0 ? (
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Inspection Items</p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {viewDetail.inspectionItems.map((item) => {
                      const result = item.inspectionResults?.[0]?.result
                      const isPass = result === "OK"
                      const isFail = result === "DEFECTIVE"
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-md border border-zinc-100 dark:border-border bg-zinc-50/80 dark:bg-muted/10 text-sm">
                          <span className="font-medium text-foreground">{item.itemName}</span>
                          <span className={cn(dashboardStatusBadgeClass, isPass ? "bg-emerald-600 text-white" : isFail ? "bg-rose-600 text-white" : "bg-amber-500 text-white")}>
                            {isPass ? "PASS" : isFail ? "FAIL" : result || "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
              <div className="pt-2 flex justify-end">
                <Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve / Reject Action Modal (opened from Pending status click) */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">
              Review Inspection #{selected?.id}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Vehicle: <strong>{selected?.vehicle?.plateNumber}</strong>
              {selected?.vehicle?.model && (
                <> — {(selected.vehicle.model as { brand?: { name?: string }; name?: string }).brand?.name} {selected.vehicle.model.name}</>
              )}
              {" · "}Inspector: <strong>{formatInspectionCreator(selected?.createdByUser)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <label className={labelCls}>Notes</label>
            <textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)}
              placeholder={actionType === "reject" ? "Reason for rejection..." : "Optional approval notes..."}
              className={textareaCls} />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsActionOpen(false)}
              className="h-10 px-4 border border-zinc-200 rounded-md text-sm">Cancel</Button>
            <Button onClick={handleReject} disabled={submitting}
              className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md text-sm flex items-center gap-2">
              {submitting && actionType === "reject" && <Loader2 className="size-4 animate-spin" />}
              <XCircle className="size-4" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={submitting}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-sm flex items-center gap-2">
              {submitting && actionType === "approve" && <Loader2 className="size-4 animate-spin" />}
              <CheckCircle className="size-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit Inspection #{selected?.id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className={labelCls}>Scheduled Date & Time</label>
              <input type="datetime-local" value={editScheduledAt} onChange={e => setEditScheduledAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className={textareaCls} />
            </div>
            <DialogFooter className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-10 px-4 border border-zinc-200 rounded-md text-sm">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
