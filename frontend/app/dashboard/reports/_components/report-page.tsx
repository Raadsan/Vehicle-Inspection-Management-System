"use client"

import React, { useEffect, useMemo, useState } from "react"
import { BadgeCheck, BadgeDollarSign, Car, CheckCircle2, CircleAlert, ClipboardCheck, CreditCard, Download, Eye, Loader2, Printer, ReceiptText, Search, ShieldCheck, Tag, Timer, UserCheck, UserX, WalletCards, XCircle } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import toast from "react-hot-toast"
import {
  customerPaymentApi,
  CustomerPayment,
  inspectionApi,
  Inspection,
  vehicleApi,
  Vehicle,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OwnerDisplay } from "@/components/owner-display"
import { cn } from "@/lib/utils"
import {
  dashboardCardClass,
  dashboardPageClass,
  dashboardPageStyle,
  dashboardStatusBadgeClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadClass,
  dashboardTableHeadRowClass,
  dashboardTableHeaderClass,
  dashboardTableIdClass,
  chartPrimary,
  formatStatusLabel,
  getVehicleBrand,
  getVehicleColor,
  getVehicleModelName,
  getVehicleYear,
  pageHeaderSubtitleClass,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
  resolveVehicleOwner,
  vehicleCellTextClass,
} from "@/lib/dashboard-ui"

export type ReportType = "vehicles" | "payments" | "inspections"

type ReportRow = Vehicle | CustomerPayment | Inspection
type SummaryItem = { label: string; value: number; money?: boolean; icon: React.ElementType }

function isVehicleRow(row: ReportRow): row is Vehicle {
  return "plateNumber" in row
}

function isPaymentRow(row: ReportRow): row is CustomerPayment {
  return "amount" in row
}

const reportMeta = {
  vehicles: {
    title: "Vehicle Report",
    subtitle: "Registered vehicles, owner details, and vehicle status",
    search: "Search plate, owner, brand...",
  },
  payments: {
    title: "Payment Report",
    subtitle: "Customer payment status, amount, method, invoice, and transaction ID",
    search: "Search owner, plate, invoice...",
  },
  inspections: {
    title: "Vehicle Inspection Report",
    subtitle: "Vehicle inspection status, result, owner, and dates",
    search: "Search inspection, plate, owner...",
  },
} as const

function formatMoney(amount?: number, currency = "USD") {
  return `${currency} ${Number(amount || 0).toFixed(2)}`
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleDateString() : "—"
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function exportCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function printReport(title: string, headers: string[], rows: Array<Array<string | number>>) {
  const htmlRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
    body{font-family:Arial,sans-serif;margin:0;padding:28px;color:#0a2744}
    .header{display:flex;justify-content:space-between;border-bottom:4px solid #1565c0;padding-bottom:16px;margin-bottom:22px}
    h1{margin:0;font-size:26px}.meta{color:#64748b;font-size:12px;text-align:right}
    table{width:100%;border-collapse:collapse}th{background:#0a2744;color:white;padding:10px;text-align:left;font-size:11px;text-transform:uppercase}
    td{border-bottom:1px solid #e5e7eb;padding:9px 10px;font-size:12px}tr:nth-child(even) td{background:#f8fafc}
    @media print{body{padding:12px}}
  </style></head><body>
    <div class="header"><div><h1>${escapeHtml(title)}</h1><p style="margin:6px 0 0;color:#64748b;font-size:13px;">Inspection Cars Dashboard Report</p></div>
    <div class="meta"><strong>Generated</strong><br/>${escapeHtml(new Date().toLocaleString())}<br/><strong>Total Rows</strong><br/>${rows.length}</div></div>
    <table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${htmlRows || `<tr><td colspan="${headers.length}">No data found</td></tr>`}</tbody></table>
    <script>window.onload=()=>window.print()</script>
  </body></html>`

  const win = window.open("", "_blank", "width=1000,height=720")
  if (!win) return toast.error("Please allow popups to print report")
  win.document.open()
  win.document.write(html)
  win.document.close()
}

function statusBadgeClass(status?: string) {
  const value = (status || "").toUpperCase()
  if (["PAID", "APPROVED", "PASS", "ACTIVE", "COMPLETED"].includes(value)) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
  }
  if (["UNPAID", "PENDING", "AWAITING_APPROVAL", "PARTIAL"].includes(value)) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
  }
  if (["FAIL", "FAILED", "REJECTED", "CANCELLED"].includes(value)) {
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
}

function vehicleRows(rows: Vehicle[]) {
  return rows.map((vehicle) => {
    const owner = resolveVehicleOwner(vehicle)
    return [
      vehicle.plateNumber,
      getVehicleBrand(vehicle),
      getVehicleModelName(vehicle),
      getVehicleColor(vehicle),
      getVehicleYear(vehicle),
      owner?.fullName || "—",
      owner?.phone || "—",
      vehicle.vin || "—",
      formatStatusLabel(vehicle.status),
    ]
  })
}

function paymentRows(rows: CustomerPayment[]) {
  return rows.map((payment) => [
    payment.vehicle?.plateNumber || "—",
    payment.owner?.fullName || "—",
    payment.owner?.phone || "—",
    formatMoney(payment.amount, payment.currency),
    payment.status,
    payment.method || "—",
    payment.reference || "—",
    payment.invoice?.invoiceNo || "—",
    formatDate(payment.paymentDate || payment.createdAt),
  ])
}

function inspectionRows(rows: Inspection[]) {
  return rows.map((inspection) => {
    const owner = resolveVehicleOwner(inspection.vehicle)
    return [
      inspection.id,
      inspection.vehicle?.plateNumber || "—",
      getVehicleBrand(inspection.vehicle),
      getVehicleModelName(inspection.vehicle),
      owner?.fullName || "—",
      owner?.phone || "—",
      formatStatusLabel(inspection.status),
      inspection.overallResult || "—",
      formatDate(inspection.completedAt || inspection.scheduledAt || inspection.createdAt),
    ]
  })
}

export function ReportPage({ type }: { type: ReportType }) {
  const meta = reportMeta[type]
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [payments, setPayments] = useState<CustomerPayment[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<ReportRow | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (type === "vehicles") setVehicles(await vehicleApi.getAll())
        if (type === "payments") setPayments(await customerPaymentApi.getAll())
        if (type === "inspections") setInspections(await inspectionApi.getAll())
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } }; message?: string }
        toast.error("Failed to load report: " + (e.response?.data?.error || e.message))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [type])

  const filteredVehicles = useMemo(() => {
    const s = search.toLowerCase()
    return vehicles.filter((vehicle) => {
      const owner = resolveVehicleOwner(vehicle)
      return [vehicle.plateNumber, vehicle.vin, getVehicleBrand(vehicle), getVehicleModelName(vehicle), owner?.fullName, owner?.phone, vehicle.status]
        .some((value) => String(value || "").toLowerCase().includes(s))
    })
  }, [vehicles, search])

  const filteredPayments = useMemo(() => {
    const s = search.toLowerCase()
    return payments.filter((payment) => [payment.vehicle?.plateNumber, payment.owner?.fullName, payment.owner?.phone, payment.status, payment.method, payment.reference, payment.invoice?.invoiceNo]
      .some((value) => String(value || "").toLowerCase().includes(s)))
  }, [payments, search])

  const filteredInspections = useMemo(() => {
    const s = search.toLowerCase()
    return inspections.filter((inspection) => {
      const owner = resolveVehicleOwner(inspection.vehicle)
      return [inspection.id, inspection.vehicle?.plateNumber, owner?.fullName, owner?.phone, inspection.status, inspection.overallResult]
        .some((value) => String(value || "").toLowerCase().includes(s))
    })
  }, [inspections, search])

  const chartItems = getChartItems(type, vehicles, payments, inspections)
  const exportData = getExportData(type, filteredVehicles, filteredPayments, filteredInspections)

  const handleExport = () => exportCsv(`${meta.title.toLowerCase().replace(/\s+/g, "-")}.csv`, exportData.headers, exportData.rows)
  const handlePrint = () => printReport(meta.title, exportData.headers, exportData.rows)

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>{meta.title}</h1>
        <p className={pageHeaderSubtitleClass}>{meta.subtitle}</p>
      </div>

      <SummaryAndChart items={chartItems} />

      <div className={dashboardCardClass}>
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0a2744] dark:text-white">{meta.title}</h2>
            <p className="text-xs text-zinc-500">Search, view details, print, or export CSV</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={meta.search}
                className="h-9 w-56 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground"
              />
            </div>
            <Button onClick={handleExport} variant="outline" className="h-9">
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handlePrint} className="h-9 bg-[#1565c0] hover:bg-[#0a2744] text-white">
              <Printer className="size-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {type === "vehicles" && <VehicleTable rows={filteredVehicles} loading={loading} onView={setSelected} />}
        {type === "payments" && <PaymentTable rows={filteredPayments} loading={loading} onView={setSelected} />}
        {type === "inspections" && <InspectionTable rows={filteredInspections} loading={loading} onView={setSelected} />}
      </div>

      <ViewDialog row={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function getExportData(type: ReportType, vehicles: Vehicle[], payments: CustomerPayment[], inspections: Inspection[]) {
  if (type === "vehicles") return { headers: ["Plate", "Brand", "Model", "Color", "Year", "Owner", "Phone", "VIN", "Status"], rows: vehicleRows(vehicles) }
  if (type === "payments") return { headers: ["License", "Owner", "Phone", "Amount", "Status", "Method", "Transaction ID", "Invoice", "Date"], rows: paymentRows(payments) }
  return { headers: ["ID", "License", "Brand", "Model", "Owner", "Phone", "Status", "Result", "Date"], rows: inspectionRows(inspections) }
}

function getChartItems(type: ReportType, vehicles: Vehicle[], payments: CustomerPayment[], inspections: Inspection[]) {
  if (type === "vehicles") {
    return [
      { label: "Total", value: vehicles.length, icon: Car },
      { label: "Active", value: vehicles.filter((v) => v.status === "ACTIVE").length, icon: CheckCircle2 },
      { label: "Inactive / Other", value: vehicles.filter((v) => v.status !== "ACTIVE").length, icon: CircleAlert },
      { label: "With Owner", value: vehicles.filter((v) => !!resolveVehicleOwner(v)).length, icon: UserCheck },
      { label: "Without Owner", value: vehicles.filter((v) => !resolveVehicleOwner(v)).length, icon: UserX },
      { label: "Brands", value: new Set(vehicles.map((v) => getVehicleBrand(v)).filter((name) => name !== "—")).size, icon: Tag },
    ]
  }
  if (type === "payments") {
    const paidPayments = payments.filter((p) => p.status === "PAID")
    const unpaidPayments = payments.filter((p) => p.status === "UNPAID")
    return [
      { label: "Total", value: payments.length, icon: ReceiptText },
      { label: "Paid", value: paidPayments.length, icon: BadgeCheck },
      { label: "Unpaid", value: unpaidPayments.length, icon: Timer },
      { label: "Paid Amount", value: paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0), money: true, icon: BadgeDollarSign },
      { label: "Unpaid Amount", value: unpaidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0), money: true, icon: CreditCard },
      { label: "Total Amount", value: payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), money: true, icon: WalletCards },
    ]
  }
  return [
    { label: "Total", value: inspections.length, icon: ClipboardCheck },
    { label: "Approved", value: inspections.filter((i) => i.status === "APPROVED").length, icon: ShieldCheck },
    { label: "Pending", value: inspections.filter((i) => ["PENDING", "AWAITING_APPROVAL"].includes(i.status)).length, icon: Timer },
    { label: "Pass", value: inspections.filter((i) => i.overallResult === "PASS").length, icon: CheckCircle2 },
    { label: "Fail", value: inspections.filter((i) => i.overallResult === "FAIL").length, icon: XCircle },
    { label: "Rejected / Expired", value: inspections.filter((i) => ["REJECTED", "EXPIRED"].includes(i.status)).length, icon: CircleAlert },
  ]
}

function SummaryAndChart({ items }: { items: SummaryItem[] }) {
  const chartData = items.map((item) => ({ ...item, name: item.label }))
  const colors = ["#0a2744", "#1565c0", "#2196f3", "#4fc3f7", "#90caf9", "#0ea5e9"]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
          <div key={item.label} className="rounded-xl border border-zinc-200 dark:border-border bg-white dark:bg-card shadow-sm p-5 min-h-[104px]">
            <div className="size-9 rounded-full flex items-center justify-center text-white mb-4" style={{ backgroundColor: colors[index % colors.length] }}>
              <Icon className="size-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{item.label}</p>
            <p className="text-2xl font-black text-[#0a2744] dark:text-white mt-1">{item.money ? formatMoney(item.value) : item.value}</p>
          </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className={dashboardCardClass}>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#0a2744] dark:text-white">Trends</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Report analytics overview</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <span className="size-2 rounded-full bg-[#1565c0]" />
                Value
              </div>
            </div>
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportValueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPrimary} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={chartPrimary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const payload = item.payload as { money?: boolean }
                      return payload.money ? formatMoney(Number(value)) : value
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke={chartPrimary} strokeWidth={2.5} fill="url(#reportValueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={dashboardCardClass}>
          <div className="p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0a2744] dark:text-white">Breakdown</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1 mb-4">Report by category</p>
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} margin={{ left: 0, right: 12, top: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const payload = item.payload as { money?: boolean }
                      return payload.money ? formatMoney(Number(value)) : value
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VehicleTable({ rows, loading, onView }: { rows: Vehicle[]; loading: boolean; onView: (row: Vehicle) => void }) {
  return (
    <ReportTableWrapper loading={loading} empty={rows.length === 0} colSpan={11}>
      <TableHeader className={dashboardTableHeaderClass}><TableRow className={dashboardTableHeadRowClass}>
        {["NO", "License", "Brand", "Model", "Color", "Year", "Owner", "Phone", "VIN", "Status", "Actions"].map((h) => <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" && "text-right")}>{h}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>{rows.map((vehicle, index) => {
        const owner = resolveVehicleOwner(vehicle)
        return (
          <TableRow key={vehicle.id} className={dashboardTableBodyRowClass}>
            <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{index + 1}</span></TableCell>
            <TableCell className={dashboardTableCellClass}><span className="font-semibold text-[#1565c0]">{vehicle.plateNumber}</span></TableCell>
            <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleBrand(vehicle)}</span></TableCell>
            <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleModelName(vehicle)}</span></TableCell>
            <TableCell className={dashboardTableCellClass}>{getVehicleColor(vehicle)}</TableCell>
            <TableCell className={dashboardTableCellClass}>{getVehicleYear(vehicle)}</TableCell>
            <TableCell className={dashboardTableCellClass}><OwnerDisplay owner={owner} vehicle={vehicle} /></TableCell>
            <TableCell className={dashboardTableCellClass}>{owner?.phone || "—"}</TableCell>
            <TableCell className={dashboardTableCellClass}><span className="font-mono text-xs">{vehicle.vin || "—"}</span></TableCell>
            <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, statusBadgeClass(vehicle.status))}>{formatStatusLabel(vehicle.status)}</span></TableCell>
            <TableCell className={cn(dashboardTableCellClass, "text-right")}><ViewButton onClick={() => onView(vehicle)} /></TableCell>
          </TableRow>
        )
      })}</TableBody>
    </ReportTableWrapper>
  )
}

function PaymentTable({ rows, loading, onView }: { rows: CustomerPayment[]; loading: boolean; onView: (row: CustomerPayment) => void }) {
  return (
    <ReportTableWrapper loading={loading} empty={rows.length === 0} colSpan={11}>
      <TableHeader className={dashboardTableHeaderClass}><TableRow className={dashboardTableHeadRowClass}>
        {["NO", "License", "Owner", "Phone", "Amount", "Status", "Method", "Transaction ID", "Invoice", "Date", "Actions"].map((h) => <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" && "text-right")}>{h}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>{rows.map((payment, index) => (
        <TableRow key={payment.id} className={dashboardTableBodyRowClass}>
          <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{index + 1}</span></TableCell>
          <TableCell className={dashboardTableCellClass}><span className="font-semibold text-[#1565c0]">{payment.vehicle?.plateNumber || "—"}</span></TableCell>
          <TableCell className={dashboardTableCellClass}><OwnerDisplay owner={payment.owner} vehicle={payment.vehicle} /></TableCell>
          <TableCell className={dashboardTableCellClass}>{payment.owner?.phone || "—"}</TableCell>
          <TableCell className={dashboardTableCellClass}><span className="font-semibold">{formatMoney(payment.amount, payment.currency)}</span></TableCell>
          <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, statusBadgeClass(payment.status))}>{payment.status}</span></TableCell>
          <TableCell className={dashboardTableCellClass}>{payment.method || "—"}</TableCell>
          <TableCell className={dashboardTableCellClass}><span className="font-mono text-xs text-[#1565c0]">{payment.reference || "—"}</span></TableCell>
          <TableCell className={dashboardTableCellClass}>{payment.invoice?.invoiceNo || "—"}</TableCell>
          <TableCell className={dashboardTableCellClass}>{formatDate(payment.paymentDate || payment.createdAt)}</TableCell>
          <TableCell className={cn(dashboardTableCellClass, "text-right")}><ViewButton onClick={() => onView(payment)} /></TableCell>
        </TableRow>
      ))}</TableBody>
    </ReportTableWrapper>
  )
}

function InspectionTable({ rows, loading, onView }: { rows: Inspection[]; loading: boolean; onView: (row: Inspection) => void }) {
  return (
    <ReportTableWrapper loading={loading} empty={rows.length === 0} colSpan={11}>
      <TableHeader className={dashboardTableHeaderClass}><TableRow className={dashboardTableHeadRowClass}>
        {["NO", "Inspection ID", "License", "Brand", "Model", "Owner", "Phone", "Status", "Result", "Date", "Actions"].map((h) => <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" && "text-right")}>{h}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>{rows.map((inspection, index) => {
        const owner = resolveVehicleOwner(inspection.vehicle)
        return (
          <TableRow key={inspection.id} className={dashboardTableBodyRowClass}>
            <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{index + 1}</span></TableCell>
            <TableCell className={dashboardTableCellClass}>#{inspection.id}</TableCell>
            <TableCell className={dashboardTableCellClass}><span className="font-semibold text-[#1565c0]">{inspection.vehicle?.plateNumber || "—"}</span></TableCell>
            <TableCell className={dashboardTableCellClass}>{getVehicleBrand(inspection.vehicle)}</TableCell>
            <TableCell className={dashboardTableCellClass}>{getVehicleModelName(inspection.vehicle)}</TableCell>
            <TableCell className={dashboardTableCellClass}><OwnerDisplay owner={owner} vehicle={inspection.vehicle} /></TableCell>
            <TableCell className={dashboardTableCellClass}>{owner?.phone || "—"}</TableCell>
            <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, statusBadgeClass(inspection.status))}>{formatStatusLabel(inspection.status)}</span></TableCell>
            <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, statusBadgeClass(inspection.overallResult))}>{inspection.overallResult || "—"}</span></TableCell>
            <TableCell className={dashboardTableCellClass}>{formatDate(inspection.completedAt || inspection.scheduledAt || inspection.createdAt)}</TableCell>
            <TableCell className={cn(dashboardTableCellClass, "text-right")}><ViewButton onClick={() => onView(inspection)} /></TableCell>
          </TableRow>
        )
      })}</TableBody>
    </ReportTableWrapper>
  )
}

function ViewButton({ onClick }: { onClick: () => void }) {
  return <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClick}><Eye className="size-4" /></Button>
}

function ReportTableWrapper({ children, loading, empty, colSpan }: { children: React.ReactNode; loading: boolean; empty: boolean; colSpan: number }) {
  if (loading || empty) {
    return (
      <div className="overflow-x-auto">
        <Table><TableBody><TableRow><TableCell colSpan={colSpan} className="py-14 text-center text-sm text-muted-foreground">
          {loading ? <><Loader2 className="size-6 animate-spin mx-auto text-primary" /><p className="mt-2">Loading report...</p></> : "No report data found"}
        </TableCell></TableRow></TableBody></Table>
      </div>
    )
  }
  return <div className="overflow-x-auto"><Table className="w-full">{children}</Table></div>
}

function ViewDialog({ row, onClose }: { row: ReportRow | null; onClose: () => void }) {
  if (!row) return null
  const fields = getViewFields(row)
  return (
    <Dialog open={!!row} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Report Details</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-zinc-50 dark:bg-muted/20 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="font-semibold text-foreground mt-1">{value}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getViewFields(row: ReportRow): Array<[string, string]> {
  if (isVehicleRow(row)) {
    const owner = resolveVehicleOwner(row)
    return [
      ["License", row.plateNumber],
      ["Brand", getVehicleBrand(row)],
      ["Model", getVehicleModelName(row)],
      ["Color", getVehicleColor(row)],
      ["Year", getVehicleYear(row)],
      ["Owner", owner?.fullName || "—"],
      ["Phone", owner?.phone || "—"],
      ["VIN", row.vin || "—"],
      ["Status", formatStatusLabel(row.status)],
    ]
  }
  if (isPaymentRow(row)) {
    return [
      ["License", row.vehicle?.plateNumber || "—"],
      ["Owner", row.owner?.fullName || "—"],
      ["Phone", row.owner?.phone || "—"],
      ["Amount", formatMoney(row.amount, row.currency)],
      ["Status", row.status],
      ["Method", row.method || "—"],
      ["Transaction ID", row.reference || "—"],
      ["Invoice", row.invoice?.invoiceNo || "—"],
      ["Date", formatDate(row.paymentDate || row.createdAt)],
      ["Description", row.notes || "—"],
    ]
  }
  const owner = resolveVehicleOwner(row.vehicle)
  return [
    ["Inspection ID", `#${row.id}`],
    ["License", row.vehicle?.plateNumber || "—"],
    ["Brand", getVehicleBrand(row.vehicle)],
    ["Model", getVehicleModelName(row.vehicle)],
    ["Owner", owner?.fullName || "—"],
    ["Phone", owner?.phone || "—"],
    ["Status", formatStatusLabel(row.status)],
    ["Result", row.overallResult || "—"],
    ["Date", formatDate(row.completedAt || row.scheduledAt || row.createdAt)],
    ["Notes", row.notes || "—"],
  ]
}
