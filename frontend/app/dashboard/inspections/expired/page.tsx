"use client"

import React, { useState, useEffect } from "react"
import { Search, Eye, Loader2, Clock } from "lucide-react"
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
  dashboardStatusBadgeClass, getOrderStatusBadgeClass, formatStatusLabel,
} from "@/lib/dashboard-ui"

export default function ExpiredInspectionsPage() {
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
      setInspections(all.filter((i: Inspection) => i.status === "EXPIRED"))
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (ax.response?.data?.error || ax.message))
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
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Clock className="size-5 text-zinc-600" />
          </div>
          <div>
            <h1 className={pageHeaderTitleClass}>Expired Inspections</h1>
            <p className={pageHeaderSubtitleClass}>Approved inspections past their expiry date</p>
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
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-52 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Vehicle", "Company", "Approved", "Expired", "Result", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-14 text-center"><Loader2 className="size-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-semibold">{row.vehicle?.plateNumber || `#${row.vehicleId}`}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600">{row.company?.name || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500">{row.approvedAt ? new Date(row.approvedAt).toLocaleDateString() : "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500">{row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(row.status))}>{formatStatusLabel(row.status)}</span>
                  </TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded">
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="py-16 text-center text-zinc-400 text-sm">No expired inspections</TableCell></TableRow>
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold">Inspection #{selected?.id} — Expired</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[["Vehicle", selected.vehicle?.plateNumber], ["Company", selected.company?.name], ["Approved", selected.approvedAt ? new Date(selected.approvedAt).toLocaleString() : "—"], ["Expired", selected.expiresAt ? new Date(selected.expiresAt).toLocaleString() : "—"], ["Result", selected.overallResult || "—"]].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-zinc-100 pb-2 gap-4">
                  <span className="text-sm text-zinc-400">{l}</span>
                  <span className="text-sm font-semibold text-right">{v}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-end">
                <Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white rounded-md text-sm">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
