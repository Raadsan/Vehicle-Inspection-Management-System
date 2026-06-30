"use client"

import React, { useState, useEffect } from "react"
import { Search, Edit, Eye, Loader2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import {
  customerPaymentApi,
  CustomerPayment,
  PaymentMethod,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, getVehicleBrand, getVehicleModelName, getVehicleColor, getVehicleYear,
  vehicleCellTextClass,
} from "@/lib/dashboard-ui"
import { OwnerDisplay } from "@/components/owner-display"

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "EVC", label: "EVC Plus" },
  { value: "MERCHANT", label: "Merchant" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
]

const methodLabel = (m?: PaymentMethod) =>
  PAYMENT_METHODS.find((x) => x.value === m)?.label || m || "—"

const inputCls =
  "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const selectCls = inputCls
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

function formatMoney(amount: number, currency = "USD") {
  return `${currency} ${Number(amount).toFixed(2)}`
}

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<CustomerPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | "PAID" | "UNPAID">("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [submitting, setSubmitting] = useState(false)

  const [isPaidOpen, setIsPaidOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<CustomerPayment | null>(null)

  const [method, setMethod] = useState<PaymentMethod>("EVC")
  const [paymentDescription, setPaymentDescription] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await customerPaymentApi.getAll()
      setPayments(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed to load: " + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { setCurrentPage(1) }, [search, statusFilter])

  const filtered = payments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false
    const s = search.toLowerCase()
    const plate = p.vehicle?.plateNumber?.toLowerCase() || ""
    const brand = getVehicleBrand(p.vehicle).toLowerCase()
    const model = getVehicleModelName(p.vehicle).toLowerCase()
    const owner = p.owner?.fullName?.toLowerCase() || ""
    const phone = p.owner?.phone?.toLowerCase() || ""
    return plate.includes(s) || brand.includes(s) || model.includes(s) || owner.includes(s) || phone.includes(s)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openPaid = (p: CustomerPayment) => {
    setSelected(p)
    setMethod("EVC")
    setPaymentDescription("")
    setIsPaidOpen(true)
  }

  const openEdit = (p: CustomerPayment) => {
    setSelected(p)
    setEditAmount(String(p.amount))
    setEditNotes(p.notes || "")
    setIsEditOpen(true)
  }

  const openView = (p: CustomerPayment) => {
    setSelected(p)
    setIsViewOpen(true)
  }

  const handleApprovePaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      const result = await customerPaymentApi.markPaid(selected.id, {
        method,
        notes: paymentDescription || undefined,
      })
      toast.success(`Payment approved — Invoice ${result.invoice.invoiceNo} · Ref ${result.transaction.reference}`)
      setIsPaidOpen(false)
      loadData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      await customerPaymentApi.update(selected.id, {
        amount: Number(editAmount),
        notes: editNotes || undefined,
      })
      toast.success("Payment updated")
      setIsEditOpen(false)
      loadData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Customer Payments</h1>
        <p className={pageHeaderSubtitleClass}>
          Payments from vehicles with owners — unpaid until you approve paid
        </p>
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
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | "PAID" | "UNPAID")}
              className="h-9 px-3 border border-zinc-200 dark:border-border rounded text-xs bg-white dark:bg-muted/20 outline-none text-foreground font-sans"
            >
              <option value="">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!loading && (
              <>
                <span className={cn(dashboardStatusBadgeClass, "h-9 px-3 items-center bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300")}>
                  Unpaid: {payments.filter((p) => p.status === "UNPAID").length}
                </span>
                <span className={cn(dashboardStatusBadgeClass, "h-9 px-3 items-center bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300")}>
                  Paid: {payments.filter((p) => p.status === "PAID").length}
                </span>
              </>
            )}
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search plate, brand, owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "License", "Brand", "Model", "Color", "Year", "Owner", "Amount", "Status", "Actions"].map((h) => (
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
                  <TableCell colSpan={10} className="py-14 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground font-medium mt-2">Loading payments...</p>
                  </TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((row, idx) => (
                  <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-semibold text-foreground">{row.vehicle?.plateNumber || "—"}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={vehicleCellTextClass}>{getVehicleBrand(row.vehicle)}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={vehicleCellTextClass}>{getVehicleModelName(row.vehicle)}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={vehicleCellTextClass}>{getVehicleColor(row.vehicle)}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={vehicleCellTextClass}>{getVehicleYear(row.vehicle)}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <OwnerDisplay owner={row.owner} vehicle={row.vehicle} />
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-semibold text-foreground">{formatMoney(row.amount, row.currency)}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span
                        className={cn(
                          dashboardStatusBadgeClass,
                          row.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        )}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        {row.status === "UNPAID" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => openPaid(row)}
                          >
                            <CheckCircle2 className="size-3.5 mr-1" /> Paid
                          </Button>
                        )}
                        {row.status === "UNPAID" && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(row)}>
                            <Edit className="size-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openView(row)}>
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="py-14 text-center text-sm text-muted-foreground">
                    No customer payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between border-t border-zinc-100 dark:border-border">
            <p className="text-xs text-zinc-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
              <span className="text-xs px-2">{currentPage} / {totalPages}</span>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Paid */}
      <Dialog open={isPaidOpen} onOpenChange={(open) => { if (open) setIsPaidOpen(true) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4 text-sm mb-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Plate</p>
                  <p className="font-semibold text-foreground">{selected.vehicle?.plateNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Owner</p>
                  <p className="font-semibold text-foreground">{selected.owner?.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Amount</p>
                  <p className="font-semibold text-foreground">{formatMoney(selected.amount, selected.currency)}</p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleApprovePaid} className="space-y-4">
            <div>
              <label className={labelCls}>Payment Method *</label>
              <select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} required>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                className={cn(inputCls, "h-24 py-2 resize-none")}
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="Write payment description..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaidOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Approve Paid
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className={labelCls}>Amount</label>
              <input className={inputCls} type="number" step="0.01" min="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea className={cn(inputCls, "h-20 py-2 resize-none")} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-zinc-500 text-xs">License</p><p className="font-semibold">{selected.vehicle?.plateNumber || "—"}</p></div>
                <div><p className="text-zinc-500 text-xs">Status</p><p className="font-semibold">{selected.status}</p></div>
                <div><p className="text-zinc-500 text-xs">Brand</p><p>{getVehicleBrand(selected.vehicle)}</p></div>
                <div><p className="text-zinc-500 text-xs">Model</p><p>{getVehicleModelName(selected.vehicle)}</p></div>
                <div><p className="text-zinc-500 text-xs">Color</p><p>{getVehicleColor(selected.vehicle)}</p></div>
                <div><p className="text-zinc-500 text-xs">Year</p><p>{getVehicleYear(selected.vehicle)}</p></div>
                <div><p className="text-zinc-500 text-xs">Owner</p><p>{selected.owner?.fullName || "—"}</p></div>
                <div><p className="text-zinc-500 text-xs">Phone</p><p>{selected.owner?.phone || "—"}</p></div>
                <div><p className="text-zinc-500 text-xs">Amount</p><p className="font-semibold">{formatMoney(selected.amount, selected.currency)}</p></div>
                <div><p className="text-zinc-500 text-xs">Method</p><p>{methodLabel(selected.method)}</p></div>
                {selected.paymentDate && (
                  <div><p className="text-zinc-500 text-xs">Paid At</p><p>{new Date(selected.paymentDate).toLocaleString()}</p></div>
                )}
                {selected.reference && (
                  <div><p className="text-zinc-500 text-xs">Transaction ID</p><p className="font-semibold font-mono text-[#1565c0]">{selected.reference}</p></div>
                )}
                {selected.invoice && (
                  <div><p className="text-zinc-500 text-xs">Invoice</p><p className="font-semibold text-[#1565c0]">{selected.invoice.invoiceNo}</p></div>
                )}
              </div>
              {selected.notes && (
                <div><p className="text-zinc-500 text-xs">Notes</p><p>{selected.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
