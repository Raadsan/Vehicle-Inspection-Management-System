"use client"

import React, { useState, useEffect } from "react"
import { Search, Loader2, Eye, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"
import { auditLogApi, AuditLog } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
  dashboardCardClass,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableIdClass,
} from "@/lib/dashboard-ui"

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      setLogs(await auditLogApi.getAll({ limit: 200 }))
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase()
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.user?.username?.toLowerCase().includes(q) ||
      log.user?.fullName?.toLowerCase().includes(q)
    )
  })

  const formatDate = (d: string) =>
    new Date(d).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Audit Log</h1>
        <p className={pageHeaderSubtitleClass}>System activity and change history</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">{filtered.length} entries</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="h-10 px-3 text-sm font-normal"
            >
              <RefreshCw className={cn("size-4 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground"
            />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["#", "Action", "Entity", "User", "Date", "Actions"].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((row, idx) => (
                  <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{idx + 1}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-medium">{row.action}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-500 font-normal">
                        {row.entity ? `${row.entity}${row.entityId ? ` #${row.entityId}` : ""}` : "—"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-600 font-normal">
                        {row.user?.fullName || row.user?.username || "—"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-500 font-normal">{formatDate(row.createdAt)}</span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelected(row)}
                        className="h-8 w-8 text-primary hover:bg-primary/5 rounded"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-zinc-400 text-sm">
                    No audit log entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-[#0a2744] dark:text-white">
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[
                ["Action", selected.action],
                ["Entity", selected.entity || "—"],
                ["Entity ID", selected.entityId?.toString() || "—"],
                ["User", selected.user?.fullName || selected.user?.username || "—"],
                ["Company", selected.company?.name || "—"],
                ["IP Address", selected.ipAddress || "—"],
                ["Date", formatDate(selected.createdAt)],
                ["Details", selected.details || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4"
                >
                  <span className="text-sm text-zinc-400 font-normal shrink-0">{label}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
