"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, Eye, Loader2, BadgeCheck, FileText } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, Inspection, Vehicle } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, formatStatusLabel,
  getInspectionInspectorDisplay,
  getVehicleBrand, getVehicleModelName, getVehicleColor, getVehicleYear,
  vehicleCellTextClass, resolveVehicleOwner,
} from "@/lib/dashboard-ui"
import { OwnerDisplay } from "@/components/owner-display"
import {
  InspectionAcceptanceCertificate,
  printAcceptanceCertificate,
  formatCertificateDate,
  getCertificateIssueDate,
  getCertificateExpiryDate,
} from "@/components/inspection-acceptance-certificate"

function getVehicleOwner(row: Inspection) {
  const v = row.vehicle as Vehicle & {
    vehicleOwners?: { owner?: { fullName?: string; phone?: string } }[]
  }
  return resolveVehicleOwner(v)
}

function formatDateTime(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleString()
}

export default function ApprovedInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isCertOpen, setIsCertOpen] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)
  const [viewDetail, setViewDetail] = useState<Inspection | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const all = await inspectionApi.getAll()
      setInspections(all.filter((i: Inspection) => i.status === "APPROVED"))
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

  const openCertificate = async (row: Inspection) => {
    setSelected(row)
    setIsCertOpen(true)
    setViewLoading(true)
    try {
      setViewDetail(await inspectionApi.getById(row.id))
    } catch {
      setViewDetail(row)
    } finally {
      setViewLoading(false)
    }
  }

  const handlePrintCertificate = () => {
    if (!certRef.current) return
    setTimeout(() => {
      if (certRef.current) printAcceptanceCertificate(certRef.current)
    }, 600)
  }

  const filtered = inspections.filter(i => {
    const s = search.toLowerCase()
    const owner = getVehicleOwner(i)
    return (i.vehicle?.plateNumber || "").toLowerCase().includes(s) ||
      (i.company?.name || "").toLowerCase().includes(s) ||
      (owner?.fullName || "").toLowerCase().includes(s) ||
      (owner?.phone || "").includes(s) ||
      String(i.id).includes(s)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const certInspection = viewDetail || selected

  const renderViewFields = (ins: Inspection) => {
    const owner = getVehicleOwner(ins)
    const inspector = getInspectionInspectorDisplay(ins.createdByUser, ins.company)

    return [
      ["Vehicle / Plate", ins.vehicle?.plateNumber || `#${ins.vehicleId}`],
      ["Chassis (VIN)", ins.vehicle?.vin || "—"],
      ["Brand", getVehicleBrand(ins.vehicle)],
      ["Model", getVehicleModelName(ins.vehicle)],
      ["Color", getVehicleColor(ins.vehicle)],
      ["Year", getVehicleYear(ins.vehicle)],
      ["Owner", owner?.fullName || "—"],
      ["Owner Phone", owner?.phone || "—"],
      ["Company", ins.company?.name || "—"],
      ["Inspector", inspector.primary + (inspector.secondary ? ` (${inspector.secondary})` : "")],
      ["Scheduled", formatDateTime(ins.scheduledAt)],
      ["Completed", formatDateTime(ins.completedAt)],
      ["Approved", formatDateTime(ins.approvedAt)],
      ["Issue Date (Tar Bixinta)", formatCertificateDate(getCertificateIssueDate(ins))],
      ["Expiry Date (Tar Dhicista)", formatCertificateDate(getCertificateExpiryDate(ins))],
      ["Result", ins.overallResult || "—"],
      ["Status", formatStatusLabel(ins.status)],
      ["Notes", ins.notes || "—"],
    ]
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
            <BadgeCheck className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className={pageHeaderTitleClass}>Approved Inspections</h1>
            <p className={pageHeaderSubtitleClass}>All inspections that have been reviewed and approved</p>
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
            <input type="text" placeholder="Search plate, owner, company..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-52 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "License", "Brand", "Model", "Color", "Year", "Owner", "Company", "Approved", "Expires", "Result", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={12} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
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
                    <span className="text-sm font-semibold text-foreground">{row.vehicle?.plateNumber || `#${row.vehicleId}`}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleBrand(vehicle)}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleModelName(vehicle)}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleColor(vehicle)}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleYear(vehicle)}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <OwnerDisplay owner={owner} vehicle={vehicle} />
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{row.company?.name || "—"}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-500">{row.approvedAt ? new Date(row.approvedAt).toLocaleDateString() : "—"}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-500">{formatCertificateDate(getCertificateExpiryDate(row))}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    {row.overallResult ? (
                      <span className={cn(dashboardStatusBadgeClass,
                        row.overallResult === "PASS" ? "bg-emerald-600 text-white" :
                        row.overallResult === "FAIL" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                      )}>{row.overallResult}</span>
                    ) : (
                      <span className={cn(dashboardStatusBadgeClass, "bg-emerald-600 text-white")}>PASS</span>
                    )}
                  </TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(row)}
                        className="h-8 w-8 text-primary hover:bg-primary/5 rounded" title="View">
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openCertificate(row)}
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-white/10 rounded" title="Waraqa Aqbalada">
                        <FileText className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}) : (
                <TableRow>
                  <TableCell colSpan={12} className="py-16 text-center">
                    <BadgeCheck className="size-10 mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400 font-medium">No approved inspections yet</p>
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
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">
              Inspection #{selected?.id}
              <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">APPROVED</span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {viewLoading ? (
                <div className="py-8 text-center"><Loader2 className="size-6 animate-spin mx-auto text-primary" /></div>
              ) : (
                <>
                  {(renderViewFields(viewDetail || selected)).map(([l, v]) => (
                    <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                      <span className="text-sm text-zinc-400 shrink-0">{l}</span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                    </div>
                  ))}
                  {(viewDetail || selected).inspectionItems && (viewDetail || selected).inspectionItems!.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Inspection Items</p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(viewDetail || selected).inspectionItems!.map((item) => {
                          const result = item.inspectionResults?.[0]?.result
                          const isPass = result === "OK"
                          return (
                            <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-zinc-50 dark:bg-muted/10 text-sm">
                              <span className="font-medium">{item.itemName}</span>
                              <span className={cn(dashboardStatusBadgeClass, isPass ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                                {isPass ? "PASS" : "FAIL"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => openCertificate(selected)}
                  className="h-10 px-4 border border-zinc-200 text-sm">
                  <FileText className="size-4 mr-2" /> Waraqa Aqbalada
                </Button>
                <Button onClick={() => setIsViewOpen(false)}
                  className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Acceptance Certificate */}
      <Dialog open={isCertOpen} onOpenChange={(open) => { setIsCertOpen(open); if (!open) setViewDetail(null) }}>
        <DialogContent className="max-w-lg bg-zinc-100 dark:bg-card border border-border rounded-lg p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">
              Waraqa Aqbalada — Acceptance Certificate
            </DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="py-12 text-center"><Loader2 className="size-6 animate-spin mx-auto text-primary" /></div>
          ) : certInspection ? (
            <>
              <InspectionAcceptanceCertificate ref={certRef} inspection={certInspection} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsCertOpen(false)} className="h-10 px-4 border border-zinc-200 text-sm">
                  Close
                </Button>
                <Button onClick={handlePrintCertificate} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-sm">
                  Print Certificate
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
