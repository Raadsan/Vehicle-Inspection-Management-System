"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Eye, Trash2, Loader2, Car } from "lucide-react"
import toast from "react-hot-toast"
import { vehicleApi, ownerApi, Vehicle, Owner } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, formatStatusLabel,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"
const STATUSES = ["ACTIVE", "INACTIVE", "UNDER_INSPECTION", "BANNED"] as const

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [companyId, setCompanyId] = useState<number>(1)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Vehicle | null>(null)
  const [ownerId, setOwnerId] = useState<number>(0)
  const [plateNumber, setPlateNumber] = useState("")
  const [vin, setVin] = useState("")
  const [color, setColor] = useState("")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [mileage, setMileage] = useState<number>(0)
  const [status, setStatus] = useState<Vehicle["status"]>("ACTIVE")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [vehs, ows] = await Promise.all([vehicleApi.getAll(), ownerApi.getAll()])
      setVehicles(vehs); setOwners(ows)
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user.companyId) setCompanyId(Number(user.companyId))
    }
    loadData()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerId) { toast.error("Please select an owner"); return }
    setSubmitting(true)
    try { await vehicleApi.create({ companyId, ownerId: Number(ownerId), plateNumber, vin: vin || undefined, color: color || undefined, year: year || undefined, mileage: mileage || undefined, status }); toast.success("Vehicle registered"); setIsAddOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSubmitting(true)
    try { await vehicleApi.update(selected.id, { ownerId: Number(ownerId), plateNumber, vin: vin || undefined, color: color || undefined, year: year || undefined, mileage: mileage || undefined, status }); toast.success("Vehicle updated"); setIsEditOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try { await vehicleApi.delete(selected.id); toast.success("Vehicle deleted"); setIsDeleteOpen(false); loadData() }
    catch (err: any) { toast.error("Failed: " + (err.response?.data?.error || err.message)) }
    finally { setSubmitting(false) }
  }

  const openAdd = () => { setOwnerId(0); setPlateNumber(""); setVin(""); setColor(""); setYear(new Date().getFullYear()); setMileage(0); setStatus("ACTIVE"); setIsAddOpen(true) }
  const openEdit = (v: Vehicle) => { setSelected(v); setOwnerId(v.ownerId); setPlateNumber(v.plateNumber); setVin(v.vin || ""); setColor(v.color || ""); setYear(v.year || new Date().getFullYear()); setMileage(v.mileage || 0); setStatus(v.status); setIsEditOpen(true) }

  const statusBadge: Record<string, string> = { ACTIVE: "bg-emerald-600 text-white", INACTIVE: "bg-zinc-400 text-white", UNDER_INSPECTION: "bg-[#1565c0] text-white", BANNED: "bg-rose-600 text-white" }

  const filtered = vehicles.filter(v => {
    const s = search.toLowerCase()
    return (v.plateNumber.toLowerCase().includes(s) || v.vin?.toLowerCase().includes(s) || v.owner?.fullName?.toLowerCase().includes(s)) && (statusFilter ? v.status === statusFilter : true)
  })

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vehicles</h1>
        <p className={pageHeaderSubtitleClass}>Manage registered vehicles in the system</p>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">{filtered.length} of {vehicles.length} vehicles</span>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 border border-zinc-200 dark:border-border rounded-md text-sm font-normal bg-white dark:bg-muted/20 focus:border-[#1565c0] outline-none text-foreground">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
            </select>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Plate, VIN, owner..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" />
            </div>
            <Button onClick={openAdd} className="h-10 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold px-5 rounded-md flex items-center gap-2 shadow-sm text-sm">
              <Plus className="size-4.5" /><span>Add Vehicle</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["#", "Plate Number", "Owner", "VIN", "Year", "Color", "Mileage", "Status", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow><TableCell colSpan={9} className="py-14 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-medium mt-2">Loading vehicles...</p>
                </TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}><span className={dashboardTableIdClass}>{idx + 1}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-bold text-foreground flex items-center gap-1.5"><Car className="size-4 text-[#1565c0] shrink-0" />{row.plateNumber}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal">{row.owner?.fullName || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-mono text-zinc-500">{row.vin || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 font-normal">{row.year || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500 font-normal">{row.color || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-500 font-normal">{row.mileage ? `${row.mileage.toLocaleString()} km` : "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className={cn(dashboardStatusBadgeClass, statusBadge[row.status] || "bg-zinc-400 text-white")}>{formatStatusLabel(row.status)}</span></TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsViewOpen(true) }} className="h-8 w-8 text-primary hover:bg-primary/5 rounded"><Eye className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(row); setIsDeleteOpen(true) }} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={9} className="py-12 text-center text-zinc-400 text-sm">No vehicles found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Register New Vehicle</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Add a vehicle to the inspection system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className={labelCls}>Owner *</label>
              <select required value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))} className={selectCls}>
                <option value="">Select owner...</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Plate Number *</label><input required type="text" placeholder="e.g. AB-1234" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Year</label><input type="number" placeholder="2024" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>Color</label><input type="text" placeholder="e.g. White" value={color} onChange={(e) => setColor(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Mileage (km)</label><input type="number" placeholder="0" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>VIN</label><input type="text" placeholder="Vehicle Identification Number" value={vin} onChange={(e) => setVin(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Vehicle["status"])} className={selectCls}>
                {STATUSES.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
              </select>
            </div>
            <DialogFooter className="col-span-2 pt-2 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}Register Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Edit Vehicle</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-normal">Update vehicle registration details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className={labelCls}>Owner *</label>
              <select required value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))} className={selectCls}>
                <option value="">Select owner...</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Plate Number *</label><input required type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Year</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>Color</label><input type="text" value={color} onChange={(e) => setColor(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Mileage (km)</label><input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>VIN</label><input type="text" value={vin} onChange={(e) => setVin(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Vehicle["status"])} className={selectCls}>
                {STATUSES.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
              </select>
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4"><DialogTitle className="text-lg font-bold text-[#0a2744] dark:text-white">Vehicle Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              {[["Plate", selected.plateNumber], ["Owner", selected.owner?.fullName || "—"], ["VIN", selected.vin || "—"], ["Year", selected.year?.toString() || "—"], ["Color", selected.color || "—"], ["Mileage", selected.mileage ? `${selected.mileage.toLocaleString()} km` : "—"], ["Status", formatStatusLabel(selected.status)]].map(([l, v]) => (
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

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border border-border rounded-lg p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600">Delete Vehicle?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-normal">Permanently remove <span className="font-semibold">{selected?.plateNumber}</span>.</DialogDescription>
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
