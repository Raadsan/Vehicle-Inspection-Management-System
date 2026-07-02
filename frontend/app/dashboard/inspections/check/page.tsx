"use client"

import React, { useState } from "react"
import { AlertTriangle, Car, CheckCircle2, History, Loader2, Search, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, type VehicleInspectionVerification } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  dashboardCardClass,
  dashboardPageClass,
  dashboardPageStyle,
  dashboardStatusBadgeClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadClass,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  formatStatusLabel,
  getOrderStatusBadgeClass,
  pageHeaderSubtitleClass,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui"

type SearchType = "plateNumber" | "vin"

function formatDate(value?: string | Date | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString()
}

function stateClass(state?: string) {
  switch (state) {
    case "ACTIVE":
      return "bg-emerald-600 text-white"
    case "EXPIRED":
      return "bg-amber-500 text-white"
    case "INVALID":
      return "bg-rose-600 text-white"
    case "NOT_FOUND":
      return "bg-zinc-700 text-white"
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
  }
}

export default function InspectionCheckPage() {
  const [searchType, setSearchType] = useState<SearchType>("plateNumber")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VehicleInspectionVerification | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) {
      toast.error("Enter plate number or VIN")
      return
    }

    setLoading(true)
    try {
      const data = await inspectionApi.verifyVehicle({ [searchType]: value })
      setResult(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: VehicleInspectionVerification & { error?: string } }; message?: string }
      const data = e.response?.data
      if (data?.inspectionState === "NOT_FOUND") {
        setResult(data)
        return
      }
      toast.error(data?.error || e.message || "Failed to check inspection")
    } finally {
      setLoading(false)
    }
  }

  const history = result?.inspectionHistory || []

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <ShieldCheck className="size-5 text-[#1565c0]" />
          </div>
          <div>
            <h1 className={pageHeaderTitleClass}>Inspection Check</h1>
            <p className={pageHeaderSubtitleClass}>Check vehicle inspection active, expired, inactive, or invalid status</p>
          </div>
        </div>
      </div>

      <div className={dashboardCardClass}>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:w-48">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Search By</label>
            <select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as SearchType)}
              className="h-11 w-full px-3 border border-zinc-200 dark:border-border rounded-lg bg-white dark:bg-muted/20 outline-none text-sm"
            >
              <option value="plateNumber">Plate Number</option>
              <option value="vin">VIN Number</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              {searchType === "plateNumber" ? "Vehicle Plate Number" : "Vehicle VIN Number"}
            </label>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchType === "plateNumber" ? "Enter plate number..." : "Enter VIN number..."}
                className="h-11 w-full pl-10 pr-3 border border-zinc-200 dark:border-border rounded-lg bg-white dark:bg-muted/20 outline-none text-sm"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="h-11 px-6 bg-[#1565c0] hover:bg-[#0a2744] text-white rounded-lg">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Check
          </Button>
        </form>
      </div>

      {result && (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
          <div className={cn(dashboardCardClass, "p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Current Status</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    {result.inspectionState === "ACTIVE" ? (
                      <CheckCircle2 className="size-6 text-[#1565c0]" />
                    ) : result.inspectionState === "EXPIRED" || result.inspectionState === "INVALID" ? (
                      <AlertTriangle className="size-6 text-[#1565c0]" />
                    ) : (
                      <ShieldCheck className="size-6 text-[#1565c0]" />
                    )}
                  </div>
                  <span className={cn(dashboardStatusBadgeClass, "px-3 py-1.5", stateClass(result.inspectionState))}>
                    {result.inspectionState}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{result.message}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-zinc-100 dark:border-border pt-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0a2744] dark:text-white">
                <Car className="size-4 text-[#1565c0]" />
                Vehicle Details
              </div>
              {[
                ["Plate Number", result.vehicle?.plateNumber],
                ["VIN Number", result.vehicle?.vin],
                ["Brand / Model", [result.vehicle?.brand, result.vehicle?.model].filter(Boolean).join(" ")],
                ["Vehicle Status", result.vehicle?.status],
                ["Company", result.vehicle?.company?.name],
                ["Valid Until", formatDate(result.activeInspection?.expiresAt || result.latestInspection?.expiresAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-zinc-100 dark:border-border pb-2 last:border-0">
                  <span className="text-sm text-zinc-500">{label}</span>
                  <span className="text-sm font-semibold text-right text-zinc-800 dark:text-white">{value || "-"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={dashboardCardClass}>
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-border flex items-center gap-2">
              <History className="size-4 text-[#1565c0]" />
              <h2 className="text-sm font-bold text-[#0a2744] dark:text-white">Inspection History</h2>
              <span className="ml-auto text-xs font-semibold text-zinc-500">{history.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className={dashboardTableHeaderClass}>
                  <TableRow className={dashboardTableHeadRowClass}>
                    {["ID", "Status", "Result", "Approved", "Expires", "Completed", "Notes"].map((head) => (
                      <TableHead key={head} className={dashboardTableHeadClass}>{head}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? history.map((row) => (
                    <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                      <TableCell className={dashboardTableCellClass}>#{row.id}</TableCell>
                      <TableCell className={dashboardTableCellClass}>
                        <span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(String(row.status || "")))}>
                          {formatStatusLabel(String(row.status || "-"))}
                        </span>
                      </TableCell>
                      <TableCell className={dashboardTableCellClass}>{row.overallResult || "-"}</TableCell>
                      <TableCell className={dashboardTableCellClass}>{formatDate(row.approvedAt)}</TableCell>
                      <TableCell className={dashboardTableCellClass}>{formatDate(row.expiresAt)}</TableCell>
                      <TableCell className={dashboardTableCellClass}>{formatDate(row.completedAt)}</TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "max-w-[220px] truncate")}>{row.notes || "-"}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-zinc-400">
                        No inspection history found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
