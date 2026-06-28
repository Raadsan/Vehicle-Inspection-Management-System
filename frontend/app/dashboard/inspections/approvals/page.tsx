"use client"

import React, { useState, useEffect } from "react"
import { Search, CheckCircle, XCircle, Clock, ClipboardList, Loader2, Eye, Building2, User } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, Inspection } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, getOrderStatusBadgeClass, formatStatusLabel,
} from "@/lib/dashboard-ui"

export default function InspectionApprovalsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await inspectionApi.getAll()
      setInspections(data)
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = inspections.filter(i => {
    const s = search.toLowerCase()
    return (
      (i.vehicle?.plateNumber || "").toLowerCase().includes(s) ||
      (i.inspector?.fullName || "").toLowerCase().includes(s) ||
      (i.company?.name || "").toLowerCase().includes(s) ||
      String(i.id).includes(s)
    ) && (statusFilter ? i.status === statusFilter : true)
  })

  const stats = {
    all: inspections.length,
    approved: inspections.filter(i => i.status === "APPROVED").length,
    rejected: inspections.filter(i => i.status === "REJECTED").length,
    pending: inspections.filter(i => i.status === "AWAITING_APPROVAL").length,
    approvedPercentage: inspections.length > 0 ? Math.round((inspections.filter(i => i.status === "APPROVED").length / inspections.length) * 100) : 0,
    rejectedPercentage: inspections.length > 0 ? Math.round((inspections.filter(i => i.status === "REJECTED").length / inspections.length) * 100) : 0,
  }

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <div className="bg-white dark:bg-card border border-zinc-100 dark:border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg", color)}>
          <Icon className="size-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Inspection Approvals</h1>
        <p className={pageHeaderSubtitleClass}>View all vehicle inspections and their approval status</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="All Inspections"value={stats.all} icon={ClipboardList} color="bg-[#1565c0]" />
        <StatCard title="Approved" value={`${stats.approved} (${stats.approvedPercentage}%)`} icon={CheckCircle} color="bg-emerald-600" />
        <StatCard title="Rejected" value={`${stats.rejected} (${stats.rejectedPercentage}%)`} icon={XCircle} color="bg-rose-600" />
        <StatCard title="Awaiting Approval" value={stats.pending} icon={Clock} color="bg-amber-500" />
      </div>

      {/* Inspections Table */}
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
              <input type="text" placeholder="Plate, inspector, company..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["ID", "Vehicle", "Inspector", "Company", "Scheduled", "Status", "Result", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading inspections...</p>
                </TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map((row) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>#{row.id}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <ClipboardList className="size-4 text-[#1565c0] shrink-0" />
                      {row.vehicle?.plateNumber || `#${row.vehicleId}`}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 font-normal flex items-center gap-1.5">
                      <User className="size-3.5 text-zinc-400" />
                      {row.inspector?.fullName || `#${row.inspectorId}`}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 font-normal flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-zinc-400" />
                      {row.company?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500 font-normal">{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(row.status))}>{formatStatusLabel(row.status)}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    {row.overallResult ? (
                      <span className={cn(dashboardStatusBadgeClass, row.overallResult === "PASS" ? "bg-emerald-600 text-white" : row.overallResult === "FAIL" ? "bg-rose-600 text-white" : "bg-amber-500 text-white")}>{row.overallResult}</span>
                    ) : (
                      <span className="text-zinc-400 text-sm font-normal">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-zinc-400 text-sm">No inspections found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4"><DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Inspection #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[
                ["Vehicle", selected.vehicle?.plateNumber || `#${selected.vehicleId}`],
                ["Inspector", selected.inspector?.fullName || `#${selected.inspectorId}`],
                ["Company", selected.company?.name || "—"],
                ["Scheduled At", selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : "—"],
                ["Started At", selected.startedAt ? new Date(selected.startedAt).toLocaleString() : "—"],
                ["Completed At", selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "—"],
                ["Status", formatStatusLabel(selected.status)],
                ["Overall Result", selected.overallResult || "—"],
                ["Notes", selected.notes || "—"],
              ].map(([l, v]) => (
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
    </div>
  )
}
