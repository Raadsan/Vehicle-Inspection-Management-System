"use client"

import React, { useState, useEffect } from "react"
import { Search, Eye, Loader2, BadgeCheck } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, Inspection } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, formatStatusLabel,
} from "@/lib/dashboard-ui"

export default function ApprovedInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const all = await inspectionApi.getAll()
      setInspections(all.filter((i: Inspection) => i.status === "APPROVED"))
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { setCurrentPage(1) }, [search])

  const filtered = inspections.filter(i => {
    const s = search.toLowerCase()
    return (i.vehicle?.plateNumber || "").toLowerCase().includes(s) ||
      (i.company?.name || "").toLowerCase().includes(s) ||
      String(i.id).includes(s)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder="Search plate, company..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Vehicle", "Company", "Scheduled", "Completed", "Result", "Actions"].map(h => (
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
                        <p className="text-xs text-zinc-400">{(row.vehicle.model as any).brand?.name} {row.vehicle.model.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{row.company?.name || "—"}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-500">{row.scheduledAt ? new Date(row.scheduledAt).toLocaleDateString() : "—"}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-500">{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : "—"}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    {row.overallResult ? (
                      <span className={cn(dashboardStatusBadgeClass,
                        row.overallResult === "PASS" ? "bg-emerald-600 text-white" :
                        row.overallResult === "FAIL" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                      )}>{row.overallResult}</span>
                    ) : (
                      <span className={cn(dashboardStatusBadgeClass, "bg-emerald-600 text-white")}>APPROVED</span>
                    )}
                  </TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }}
                      className="h-8 w-8 text-primary hover:bg-primary/5 rounded" title="View">
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <BadgeCheck className="size-10 mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400 font-medium">No approved inspections yet</p>
                    <p className="text-xs text-zinc-400 mt-1">Approved inspections will appear here</p>
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
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">
              Inspection #{selected?.id}
              <span className={cn("ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700")}>APPROVED</span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[
                ["Vehicle", selected.vehicle?.plateNumber || `#${selected.vehicleId}`],
                ["Model", selected.vehicle?.model ? `${(selected.vehicle.model as any).brand?.name || ""} ${selected.vehicle.model.name}` : "—"],
                ["Company", selected.company?.name || "—"],
                ["Scheduled", selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : "—"],
                ["Completed", selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "—"],
                ["Result", selected.overallResult || "—"],
                ["Notes", selected.notes || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                  <span className="text-sm text-zinc-400 shrink-0">{l}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-end">
                <Button onClick={() => setIsViewOpen(false)}
                  className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
