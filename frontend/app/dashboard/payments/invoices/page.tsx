"use client"

import React, { useState, useEffect } from "react"
import { Search, Eye, Loader2, Printer } from "lucide-react"
import toast from "react-hot-toast"
import { invoiceApi, Invoice, PaymentMethod } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, getVehicleBrand, getVehicleModelName, getVehicleColor, getVehicleYear,
  vehicleCellTextClass,
} from "@/lib/dashboard-ui"
import { OwnerDisplay } from "@/components/owner-display"

const METHOD_LABELS: Record<PaymentMethod, string> = {
  EVC: "EVC Plus",
  MERCHANT: "Merchant",
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  CASH: "Cash",
  CARD: "Card",
  OTHER: "Other",
}

function formatMoney(amount: number, currency = "USD") {
  return `${currency} ${Number(amount).toFixed(2)}`
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleDateString() : "—"
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function printInvoice(invoice: Invoice) {
  const transaction = invoice.transactions?.[0]
  const logoUrl = `${window.location.origin}/login_bg.png`
  const brand = getVehicleBrand(invoice.vehicle)
  const model = getVehicleModelName(invoice.vehicle)
  const color = getVehicleColor(invoice.vehicle)
  const year = getVehicleYear(invoice.vehicle)
  const html = `<!doctype html>
<html>
<head>
  <title>${escapeHtml(invoice.invoiceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #0a2744; background: #f4f7fb; }
    .invoice { max-width: 820px; margin: 0 auto; background: white; border: 1px solid #dbe4f0; border-radius: 18px; overflow: hidden; }
    .header { display: flex; justify-content: space-between; gap: 24px; padding: 28px; background: linear-gradient(135deg, #0a2744, #1565c0); color: white; }
    .logo { width: 150px; height: auto; object-fit: contain; background: white; border-radius: 12px; padding: 8px; }
    .title { text-align: right; }
    .title h1 { margin: 0; font-size: 30px; letter-spacing: 2px; }
    .title p { margin: 7px 0 0; font-size: 13px; opacity: .9; }
    .section { padding: 24px 28px; border-bottom: 1px solid #edf2f7; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; margin-bottom: 5px; }
    .value { font-size: 14px; font-weight: 700; color: #0a2744; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #0a2744; color: white; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; padding: 12px; }
    td { border-bottom: 1px solid #edf2f7; padding: 13px 12px; font-size: 13px; color: #1f2937; }
    .totals { margin-left: auto; width: 320px; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
    .grand { font-size: 18px; font-weight: 800; color: #1565c0; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #dcfce7; color: #166534; }
    .footer { padding: 18px 28px; font-size: 12px; color: #64748b; text-align: center; }
    @media print {
      body { background: white; padding: 0; }
      .invoice { border: none; border-radius: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <img class="logo" src="${logoUrl}" alt="Logo" />
        <p style="margin:14px 0 0;font-size:13px;">Vehicle Inspection & Registration Services</p>
      </div>
      <div class="title">
        <h1>INVOICE</h1>
        <p>${escapeHtml(invoice.invoiceNo)}</p>
        <p><span class="badge">${escapeHtml(invoice.status)}</span></p>
      </div>
    </div>
    <div class="section grid">
      <div>
        <div class="label">Bill To</div>
        <div class="value">${escapeHtml(invoice.owner?.fullName)}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Phone: ${escapeHtml(invoice.owner?.phone)}</div>
      </div>
      <div>
        <div class="label">Invoice Date</div>
        <div class="value">${escapeHtml(formatDate(invoice.createdAt))}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Company: ${escapeHtml(invoice.company?.name)}</div>
      </div>
    </div>
    <div class="section">
      <div class="label">Vehicle Details</div>
      <table>
        <thead><tr><th>License</th><th>Brand</th><th>Model</th><th>Color</th><th>Year</th></tr></thead>
        <tbody><tr><td>${escapeHtml(invoice.vehicle?.plateNumber)}</td><td>${escapeHtml(brand)}</td><td>${escapeHtml(model)}</td><td>${escapeHtml(color)}</td><td>${escapeHtml(year)}</td></tr></tbody>
      </table>
    </div>
    <div class="section">
      <table>
        <thead><tr><th>Description</th><th>Method</th><th>Transaction ID</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>${escapeHtml(invoice.notes || "Registration payment")}</td>
            <td>${escapeHtml(transaction ? METHOD_LABELS[transaction.method] || transaction.method : "—")}</td>
            <td>${escapeHtml(transaction?.reference)}</td>
            <td style="text-align:right;font-weight:700;">${escapeHtml(formatMoney(invoice.totalAmount, invoice.currency))}</td>
          </tr>
        </tbody>
      </table>
      <div class="totals">
        <div class="total-row"><span>Total</span><strong>${escapeHtml(formatMoney(invoice.totalAmount, invoice.currency))}</strong></div>
        <div class="total-row"><span>Paid</span><strong>${escapeHtml(formatMoney(invoice.paidAmount, invoice.currency))}</strong></div>
        <div class="total-row grand"><span>Balance</span><span>${escapeHtml(formatMoney(Number(invoice.totalAmount) - Number(invoice.paidAmount), invoice.currency))}</span></div>
      </div>
    </div>
    <div class="footer">Thank you. This invoice was generated automatically after payment approval.</div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`

  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) {
    toast.error("Please allow popups to print invoice")
    return
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await invoiceApi.getAll(
        statusFilter ? { status: statusFilter as Invoice["status"] } : undefined
      )
      setInvoices(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed to load: " + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [statusFilter])
  useEffect(() => { setCurrentPage(1) }, [search, statusFilter])

  const filtered = invoices.filter((inv) => {
    const s = search.toLowerCase()
    return (
      inv.invoiceNo.toLowerCase().includes(s) ||
      inv.owner?.fullName?.toLowerCase().includes(s) ||
      inv.vehicle?.plateNumber?.toLowerCase().includes(s)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Invoices</h1>
        <p className={pageHeaderSubtitleClass}>Invoices created when customer payments are approved</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                className="h-9 px-2 border border-zinc-200 dark:border-border rounded bg-white dark:bg-muted/20 outline-none text-xs text-foreground"
              >
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-zinc-200 dark:border-border rounded text-xs bg-white dark:bg-muted/20 outline-none text-foreground"
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search invoice, plate, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Invoice No", "License", "Brand", "Model", "Color", "Year", "Owner", "Total", "Status", "Date", "Actions"].map((h) => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-14 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((row, idx) => (
                  <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-semibold text-[#1565c0]">{row.invoiceNo}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>{row.vehicle?.plateNumber || "—"}</TableCell>
                    <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleBrand(row.vehicle)}</span></TableCell>
                    <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleModelName(row.vehicle)}</span></TableCell>
                    <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleColor(row.vehicle)}</span></TableCell>
                    <TableCell className={dashboardTableCellClass}><span className={vehicleCellTextClass}>{getVehicleYear(row.vehicle)}</span></TableCell>
                    <TableCell className={dashboardTableCellClass}><OwnerDisplay owner={row.owner} vehicle={row.vehicle} /></TableCell>
                    <TableCell className={dashboardTableCellClass}>{formatMoney(row.totalAmount, row.currency)}</TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={cn(dashboardStatusBadgeClass,
                        row.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>{row.status}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="View invoice"
                          onClick={() => { setSelected(row); setIsViewOpen(true) }}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-[#1565c0]"
                          title="Print invoice"
                          onClick={() => printInvoice(row)}
                        >
                          <Printer className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="py-14 text-center text-sm text-muted-foreground">No invoices found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between border-t border-zinc-100 dark:border-border">
            <p className="text-xs text-zinc-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Invoice Details</DialogTitle>
              {selected && (
                <Button size="sm" className="bg-[#1565c0] hover:bg-[#0a2744] text-white" onClick={() => printInvoice(selected)}>
                  <Printer className="size-4 mr-2" />
                  Print
                </Button>
              )}
            </div>
          </DialogHeader>
          {selected && (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-border bg-white dark:bg-card text-sm">
              <div className="bg-[#0a2744] text-white p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/70 font-bold">Invoice</p>
                  <h2 className="text-2xl font-bold mt-1">{selected.invoiceNo}</h2>
                  <p className="text-xs text-white/70 mt-1">Created {formatDate(selected.createdAt)}</p>
                </div>
                <span className={cn(
                  dashboardStatusBadgeClass,
                  selected.status === "PAID" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {selected.status}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-zinc-50 dark:bg-muted/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Bill To</p>
                    <p className="font-semibold text-foreground">{selected.owner?.fullName || "—"}</p>
                    <p className="text-zinc-500 mt-1">Phone: {selected.owner?.phone || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-muted/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Vehicle</p>
                    <p className="font-semibold text-foreground">{selected.vehicle?.plateNumber || "—"}</p>
                    <p className="text-zinc-500 mt-1">
                      {getVehicleBrand(selected.vehicle)} {getVehicleModelName(selected.vehicle)}
                    </p>
                    <p className="text-zinc-500 mt-1">
                      {getVehicleColor(selected.vehicle)} / {getVehicleYear(selected.vehicle)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-border">
                  <Table>
                    <TableHeader className={dashboardTableHeaderClass}>
                      <TableRow className={dashboardTableHeadRowClass}>
                        <TableHead className={dashboardTableHeadClass}>Description</TableHead>
                        <TableHead className={dashboardTableHeadClass}>Method</TableHead>
                        <TableHead className={dashboardTableHeadClass}>Transaction ID</TableHead>
                        <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selected.transactions?.length ? selected.transactions : [undefined]).map((tx, index) => (
                        <TableRow key={tx?.id || index}>
                          <TableCell className={dashboardTableCellClass}>{selected.notes || "Registration payment"}</TableCell>
                          <TableCell className={dashboardTableCellClass}>{tx ? METHOD_LABELS[tx.method] || tx.method : "—"}</TableCell>
                          <TableCell className={dashboardTableCellClass}>
                            <span className="font-mono text-xs text-[#1565c0]">{tx?.reference || "—"}</span>
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-right font-semibold")}>
                            {formatMoney(tx?.amount ?? selected.totalAmount, tx?.currency ?? selected.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-xs rounded-lg bg-zinc-50 dark:bg-muted/20 p-4 space-y-2">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                      <span>Total</span>
                      <span className="font-semibold">{formatMoney(selected.totalAmount, selected.currency)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                      <span>Paid</span>
                      <span className="font-semibold">{formatMoney(selected.paidAmount, selected.currency)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-[#1565c0] font-bold">
                      <span>Balance</span>
                      <span>{formatMoney(Number(selected.totalAmount) - Number(selected.paidAmount), selected.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
