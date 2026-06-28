"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Eye, Trash2, Loader2, ClipboardList, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, vehicleApi, userApi, companyApi, Inspection, Vehicle, User, Company } from "@/lib/api"
import { getStoredUser, isCompanyUser, isSuperAdmin, type StoredUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, getOrderStatusBadgeClass, formatStatusLabel, dashboardAddButtonClass,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

type OrgType = "" | "dowlada" | "company"

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [companyId, setCompanyId] = useState<number>(1)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)
  const [vehicleId, setVehicleId] = useState<number>(0)
  const [orgType, setOrgType] = useState<OrgType>("")
  const [selectedUserId, setSelectedUserId] = useState<number | "">("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [status, setStatus] = useState<Inspection["status"]>("PENDING")
  const [overallResult, setOverallResult] = useState<Inspection["overallResult"]>(undefined)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const user = currentUser ?? getStoredUser()
  const companyLocked = isCompanyUser(user)
  const adminUser = isSuperAdmin(user) || user?.role === "STAFF"

  const adminUsers = users.filter(u => u.isActive && (u.role === "SUPER_ADMIN" || u.role === "STAFF"))

  const applyCompanyDefaults = (user: StoredUser) => {
    setOrgType("company")
    setSelectedCompanyId(user.companyId)
    setSelectedUserId(user.id)
  }

  const applyDowladaDefaults = (user: StoredUser) => {
    setOrgType("dowlada")
    setSelectedUserId(user.id)
    setSelectedCompanyId("")
  }

  const resolveScheduleCompanyId = (): number => {
    if (orgType === "company" && selectedCompanyId) return Number(selectedCompanyId)
    if (orgType === "dowlada" && selectedUserId) {
      const user = users.find(u => u.id === Number(selectedUserId))
      return user?.companyId ?? companyId
    }
    return companyId
  }

  const loadData = async () => {
    setLoading(true)
    const user = getStoredUser()
    setCurrentUser(user)
    try {
      const requests: Promise<unknown>[] = [
        inspectionApi.getAll(),
        vehicleApi.getAll(),
      ]
      if (adminUser && !companyLocked) {
        requests.push(userApi.getAll(), companyApi.getAll())
      }
      const results = await Promise.all(requests)
      setInspections(results[0] as Inspection[])
      setVehicles(results[1] as Vehicle[])
      if (adminUser && !companyLocked) {
        setUsers(results[2] as User[])
        setCompanies((results[3] as Company[]).filter(c => c.isActive))
      } else if (user) {
        setUsers([user as User])
        setCompanies(user.companyName
          ? [{ id: user.companyId, name: user.companyName, isActive: true } as Company]
          : [])
      }
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const user = getStoredUser()
    if (user?.companyId) setCompanyId(Number(user.companyId))
    setCurrentUser(user)
    loadData()
  }, [])

  const resetForm = () => {
    setVehicleId(0)
    setOrgType("")
    setSelectedUserId("")
    setSelectedCompanyId("")
    setSelectedUserId("")
    setScheduledAt("")
    setStatus("PENDING")
    setOverallResult(undefined)
    setNotes("")
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId) { toast.error("Select a vehicle"); return }
    if (!orgType) { toast.error("Select Dowlada or Company"); return }
    if (orgType === "dowlada" && !selectedUserId) { toast.error("Select a user"); return }
    if (orgType === "company" && !selectedCompanyId) { toast.error("Select a company"); return }

    setSubmitting(true)
    try {
      await inspectionApi.create({
        companyId: resolveScheduleCompanyId(),
        vehicleId: Number(vehicleId),
        scheduledAt: scheduledAt || undefined,
        status,
        overallResult: overallResult || undefined,
        notes: notes || undefined,
      })
      toast.success("Inspection scheduled")
      setIsAddOpen(false)
      loadData()
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return
    if (!vehicleId) { toast.error("Select a vehicle"); return }
    if (!orgType) { toast.error("Select Dowlada or Company"); return }
    if (orgType === "dowlada" && !selectedUserId) { toast.error("Select a user"); return }
    if (orgType === "company" && !selectedCompanyId) { toast.error("Select a company"); return }

    setSubmitting(true)
    try {
      await inspectionApi.update(selected.id, {
        vehicleId: Number(vehicleId),
        scheduledAt: scheduledAt || undefined,
        status,
        overallResult: overallResult || undefined,
        notes: notes || undefined,
      })
      toast.success("Inspection updated")
      setIsEditOpen(false)
      loadData()
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try { await inspectionApi.delete(selected.id); toast.success("Inspection deleted"); setIsDeleteOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const openAdd = () => {
    resetForm()
    const user = getStoredUser()
    if (user && isCompanyUser(user)) applyCompanyDefaults(user)
    else if (user && isSuperAdmin(user)) applyDowladaDefaults(user)
    setIsAddOpen(true)
  }

  const openEdit = (ins: Inspection) => {
    setSelected(ins)
    setVehicleId(ins.vehicleId)
    setScheduledAt(ins.scheduledAt ? ins.scheduledAt.slice(0, 16) : "")
    setStatus(ins.status)
    setOverallResult(ins.overallResult)
    setNotes(ins.notes || "")

    if (companyLocked && currentUser) {
      applyCompanyDefaults(currentUser)
    } else if (ins.companyId) {
      setOrgType("company")
      setSelectedCompanyId(ins.companyId)
      setSelectedUserId("")
    } else {
      setOrgType("dowlada")
      setSelectedUserId(currentUser?.id || "")
    }
    setIsEditOpen(true)
  }

  const lockedInputCls = cn(selectCls, "bg-zinc-50 dark:bg-muted/30 cursor-not-allowed")

  const inspectorAssignmentFields = (
    <>
      <div className="col-span-2">
        <label className={labelCls}>Inspector *</label>
        {companyLocked ? (
          <input disabled value="Company" className={lockedInputCls} />
        ) : (
          <select
            required
            value={orgType}
            onChange={(e) => {
              const v = e.target.value as OrgType
              setOrgType(v)
              setSelectedUserId("")
              setSelectedCompanyId("")
              if (v === "dowlada" && currentUser) setSelectedUserId(currentUser.id)
            }}
            className={selectCls}
          >
            <option value="">Select type...</option>
            <option value="dowlada">Dowlada</option>
            <option value="company">Company</option>
          </select>
        )}
      </div>

      {orgType === "dowlada" && !companyLocked && (
        <div className="col-span-2">
          <label className={labelCls}>User / Admin *</label>
          <select
            required
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value === "" ? "" : Number(e.target.value))}
            className={selectCls}
          >
            <option value="">Select user...</option>
            {adminUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.fullName || u.username}{u.role === "SUPER_ADMIN" ? " (Admin)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {orgType === "company" && (
        <>
          <div className="col-span-2">
            <label className={labelCls}>Company Name *</label>
            {companyLocked ? (
              <input
                disabled
                value={currentUser?.companyName || companies.find(c => c.id === selectedCompanyId)?.name || ""}
                className={lockedInputCls}
              />
            ) : (
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value === "" ? "" : Number(e.target.value))}
                className={selectCls}
              >
                <option value="">Select company...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          {companyLocked && (
            <div className="col-span-2">
              <label className={labelCls}>User</label>
              <input
                disabled
                value={currentUser?.fullName || currentUser?.username || ""}
                className={lockedInputCls}
              />
            </div>
          )}
        </>
      )}
    </>
  )

  const filtered = inspections.filter(i => {
    const s = search.toLowerCase()
    return ((i.vehicle?.plateNumber || "").toLowerCase().includes(s) || (i.inspector?.fullName || "").toLowerCase().includes(s) || String(i.id).includes(s)) && (statusFilter ? i.status === statusFilter : true)
  })

  const resultBadge = (r?: string) => {
    if (!r) return <span className="text-zinc-400 text-sm font-normal">—</span>
    const cls = r === "PASS" ? "bg-emerald-600 text-white" : r === "FAIL" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
    return <span className={cn(dashboardStatusBadgeClass, cls)}>{r}</span>
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Inspections</h1>
        <p className={pageHeaderSubtitleClass}>Schedule and manage vehicle inspection records</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">{filtered.length} of {inspections.length} records</span>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 border border-zinc-200 dark:border-border rounded-md text-sm font-normal bg-white dark:bg-muted/20 focus:border-[#1565c0] outline-none text-foreground">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Plate, inspector, ID..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" />
            </div>
            <Button onClick={openAdd} className={dashboardAddButtonClass}>
              <Plus className="size-4" /><span>Schedule Inspection</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["ID", "Vehicle", "Company", "Scheduled", "Status", "Result", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading inspections...</p>
                </TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map((row) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>#{row.id}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-semibold text-foreground flex items-center gap-1.5"><ClipboardList className="size-4 text-[#1565c0] shrink-0" />{row.vehicle?.plateNumber || `#${row.vehicleId}`}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 dark:text-zinc-400 font-normal">{row.company?.name || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500 font-normal">{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(row.status))}>{formatStatusLabel(row.status)}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>{resultBadge(row.overallResult)}</TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                      {row.status === "COMPLETED" && (
                        <Button variant="ghost" size="icon" title="Send for Approval"
                          onClick={async () => { try { await inspectionApi.update(row.id, { status: "AWAITING_APPROVAL" }); toast.success("Sent for approval!"); loadData() } catch { toast.error("Failed") } }}
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-white/10 rounded"><CheckCircle className="size-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-zinc-400 text-sm">No inspections found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Schedule New Inspection</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Assign a vehicle, inspector, and date.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 py-2">
            <div><label className={labelCls}>Vehicle *</label>
              <select required value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))} className={selectCls}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}{v.model?.name ? ` — ${v.model.name}` : ""}</option>)}
              </select>
            </div>
            {inspectorAssignmentFields}
            <div><label className={labelCls}>Date & Time</label><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Inspection["status"])} className={selectCls}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls}>Overall Result</label>
              <select value={overallResult || ""} onChange={(e) => setOverallResult((e.target.value as Inspection["overallResult"]) || undefined)} className={selectCls}>
                <option value="">Not Determined</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
                <option value="CONDITIONAL">Conditional</option>
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls}>Notes / Remarks</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..."
                className="w-full h-20 px-3 py-2.5 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal resize-none" />
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit Inspection #{selected?.id}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Update inspection details and outcome.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 py-2">
            <div><label className={labelCls}>Vehicle *</label>
              <select required value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))} className={selectCls}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}{v.model?.name ? ` — ${v.model.name}` : ""}</option>)}
              </select>
            </div>
            {inspectorAssignmentFields}
            <div><label className={labelCls}>Date & Time</label><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Inspection["status"])} className={selectCls}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls}>Overall Result</label>
              <select value={overallResult || ""} onChange={(e) => setOverallResult((e.target.value as Inspection["overallResult"]) || undefined)} className={selectCls}>
                <option value="">Not Determined</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
                <option value="CONDITIONAL">Conditional</option>
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls}>Notes / Remarks</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full h-20 px-3 py-2.5 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal resize-none" />
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
          <DialogHeader className="mb-4"><DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Inspection #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[["Vehicle", selected.vehicle?.plateNumber || `#${selected.vehicleId}`], ["Company", selected.company?.name || "—"], ["Scheduled At", selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : "—"], ["Status", formatStatusLabel(selected.status)], ["Overall Result", selected.overallResult || "—"], ["Notes", selected.notes || "—"]].map(([l, v]) => (
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
            <DialogTitle className="text-lg font-bold text-rose-600">Delete Inspection?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-normal">Permanently remove inspection #{selected?.id}.</DialogDescription>
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
