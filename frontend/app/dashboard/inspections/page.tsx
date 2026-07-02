"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Plus, Edit, Eye, Trash2, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, vehicleApi, userApi, companyApi, Inspection, Vehicle, User, Company } from "@/lib/api"
import { getStoredUser, isCompanyUser, isDowladaUser, type StoredUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, formatStatusLabel, dashboardAddButtonClass,
  formatInspectionCreator,
  getInspectionInspectorDisplay,
  getVehicleBrand, getVehicleModelName, getVehicleColor, getVehicleYear,
  vehicleCellTextClass, resolveVehicleOwner,
} from "@/lib/dashboard-ui"
import { OwnerDisplay } from "@/components/owner-display"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

function isSystemUserRole(role?: string) {
  const normalized = String(role || "").toLowerCase().replace(/[\s_-]+/g, "")
  return normalized === "admin" || normalized === "superadmin"
}

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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewDetail, setViewDetail] = useState<Inspection | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const user = currentUser ?? getStoredUser()
  const companyLocked = isCompanyUser(user)
  const adminUser = isDowladaUser(user)

  const adminUsers = users.filter(u => u.isActive && isSystemUserRole(u.role))

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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message || "Unknown error"))
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const user = getStoredUser()
      if (user?.companyId) setCompanyId(Number(user.companyId))
      setCurrentUser(user)
      loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 0)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

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

  const openView = async (ins: Inspection) => {
    setSelected(ins)
    setIsViewOpen(true)
    setViewLoading(true)
    try {
      const detail = await inspectionApi.getById(ins.id)
      setViewDetail(detail)
    } catch {
      setViewDetail(ins)
    } finally {
      setViewLoading(false)
    }
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message || "Unknown error"))
    }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try { await inspectionApi.delete(selected.id); toast.success("Inspection deleted"); setIsDeleteOpen(false); loadData() }
    catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message || "Unknown error"))
    }
    finally { setSubmitting(false) }
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
                {u.fullName || u.username}{isSystemUserRole(u.role) ? " (Admin)" : ""}
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
    const brand = (i.vehicle?.model as { brand?: { name?: string } } | undefined)?.brand?.name || ""
    const model = i.vehicle?.model?.name || ""
    const creator = formatInspectionCreator(i.createdByUser).toLowerCase()
    const company = (i.company?.name || "").toLowerCase()
    return (
      ((i.vehicle?.plateNumber || "").toLowerCase().includes(s) ||
        brand.toLowerCase().includes(s) ||
        model.toLowerCase().includes(s) ||
        creator.includes(s) ||
        company.includes(s) ||
        String(i.id).includes(s)) &&
      (statusFilter ? i.status === statusFilter : true)
    )
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const resultBadge = (r?: string) => {
    if (!r) return <span className="text-zinc-400 text-xs">—</span>
    const passed = r === "PASS"
    return (
      <span className={cn(
        dashboardStatusBadgeClass,
        passed ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
      )}>
        {passed ? "PASS" : "FAIL"}
      </span>
    )
  }

  const statusBadge = () => (
    <span className={cn(dashboardStatusBadgeClass, "bg-amber-500 text-white")}>
      Pending
    </span>
  )

  const getVehicleOwner = (row: Inspection) => {
    const v = row.vehicle as Vehicle & {
      vehicleOwners?: { owner?: { fullName?: string; phone?: string } }[]
    }
    return resolveVehicleOwner(v)
  }

  const formatDate = (d?: string) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vehicle Inspections</h1>
        <p className={pageHeaderSubtitleClass}>View and manage all vehicle inspection records</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                className="h-9 px-2 border border-zinc-200 dark:border-border rounded bg-white dark:bg-muted/20 outline-none text-xs text-foreground"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-zinc-200 dark:border-border rounded text-xs bg-white dark:bg-muted/20 outline-none text-foreground font-sans"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="EXPIRED">Expired</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
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
            <Link href="/dashboard/inspections/create" className={dashboardAddButtonClass}>
              <Plus className="size-4" /><span>Schedule Inspection</span>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["No", "License Plate", "Brand", "Model", "Color", "Year", "Owner", "Inspection Date", "Inspector", "Status", "Result", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={12} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading inspections...</p>
                </TableCell></TableRow>
              ) : paginatedData.length > 0 ? paginatedData.map((row, idx) => {
                const owner = getVehicleOwner(row)
                const vehicle = row.vehicle as Vehicle | undefined
                return (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm font-bold text-[#1565c0]">{row.vehicle?.plateNumber || `#${row.vehicleId}`}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm font-medium text-foreground">{getVehicleBrand(vehicle)}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm font-medium text-foreground">{getVehicleModelName(vehicle)}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={vehicleCellTextClass}>{getVehicleColor(vehicle)}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={vehicleCellTextClass}>{getVehicleYear(vehicle)}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <OwnerDisplay owner={owner} vehicle={vehicle} />
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-600">{formatDate(row.scheduledAt || row.completedAt)}</span>
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
                    {statusBadge()}
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>{resultBadge(row.overallResult)}</TableCell>
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
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }}
                        className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded" title="Delete">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}) : (
                <TableRow><TableCell colSpan={10} className="py-12 text-center text-zinc-400 text-sm">No inspections found</TableCell></TableRow>
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
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 p-0"
              >
                <span className="text-xs font-semibold">&lt;</span>
              </Button>
              <span className="text-xs font-bold px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 p-0"
              >
                <span className="text-xs font-semibold">&gt;</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={(open) => { setIsViewOpen(open); if (!open) setViewDetail(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4"><DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Inspection #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[
                ["Vehicle", selected.vehicle?.plateNumber || `#${selected.vehicleId}`],
                ["Brand", getVehicleBrand(viewDetail?.vehicle || selected.vehicle)],
                ["Model", getVehicleModelName(viewDetail?.vehicle || selected.vehicle)],
                ["Color", getVehicleColor(viewDetail?.vehicle || selected.vehicle)],
                ["Year", getVehicleYear(viewDetail?.vehicle || selected.vehicle)],
                ["Owner", resolveVehicleOwner(viewDetail?.vehicle || selected.vehicle)?.fullName || "—"],
                ["Owner Phone", resolveVehicleOwner(viewDetail?.vehicle || selected.vehicle)?.phone || "—"],
                ["Company", selected.company?.name || "—"],
                ["Inspector", formatInspectionCreator(viewDetail?.createdByUser || selected.createdByUser)],
                ["Scheduled At", selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : "—"],
                ["Status", formatStatusLabel(selected.status)],
                ["Overall Result", selected.overallResult || "—"],
                ["Notes", selected.notes || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                  <span className="text-sm text-zinc-400 font-normal shrink-0">{l}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                </div>
              ))}
              {viewLoading ? (
                <div className="py-6 text-center"><Loader2 className="size-5 animate-spin mx-auto text-primary" /></div>
              ) : viewDetail?.inspectionItems && viewDetail.inspectionItems.length > 0 ? (
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Inspection Items</p>
                  <div className="space-y-1.5">
                    {viewDetail.inspectionItems.map((item) => {
                      const result = item.inspectionResults?.[0]?.result
                      const isPass = result === "OK"
                      const isFail = result === "DEFECTIVE"
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-zinc-50 dark:bg-muted/10 text-sm">
                          <span className="font-medium">{item.itemName}</span>
                          <span className={cn(dashboardStatusBadgeClass, isPass ? "bg-emerald-600 text-white" : isFail ? "bg-rose-600 text-white" : "bg-amber-500 text-white")}>
                            {isPass ? "PASS" : isFail ? "FAIL" : result || "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
              <div className="pt-2 flex justify-end"><Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button></div>
            </div>
          )}
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
