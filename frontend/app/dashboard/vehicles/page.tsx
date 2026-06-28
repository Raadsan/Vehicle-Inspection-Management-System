"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Edit, Eye, Trash2, Loader2, DollarSign } from "lucide-react"
import toast from "react-hot-toast"
import { vehicleApi, ownerApi, vehicleBrandApi, vehicleModelApi, vehicleColorApi, registrationFeeApi, Vehicle, Owner, VehicleBrand, VehicleModel, VehicleColor, RegistrationFee } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardStatusBadgeClass, formatStatusLabel, dashboardAddButtonClass,
} from "@/lib/dashboard-ui"

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"
const STATUSES = ["ACTIVE", "INACTIVE", "UNDER_INSPECTION", "BANNED"] as const

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [colors, setColors] = useState<VehicleColor[]>([])
  const [registrationFees, setRegistrationFees] = useState<RegistrationFee[]>([])
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
  const [brandId, setBrandId] = useState<number | "">("")
  const [modelId, setModelId] = useState<number | "">("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vin, setVin] = useState("")
  const [colorId, setColorId] = useState<number | "">("")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [mileage, setMileage] = useState<number>(0)
  const [logbookNumber, setLogbookNumber] = useState("")
  const [status, setStatus] = useState<Vehicle["status"]>("ACTIVE")
  const [registrationFeeId, setRegistrationFeeId] = useState<number | "">("")
  const [customFeeAmount, setCustomFeeAmount] = useState("")
  const [useCustomFee, setUseCustomFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadData = async () => {
    setLoading(true)
    try {
      const [vehs, ows, brandsData, modelsData, colorsData, fees] = await Promise.all([
        vehicleApi.getAll(),
        ownerApi.getAll(),
        vehicleBrandApi.getAll(),
        vehicleModelApi.getAll(),
        vehicleColorApi.getAll(),
        registrationFeeApi.getAll({ companyId })
      ])
      setVehicles(vehs)
      setOwners(ows)
      setBrands(brandsData)
      setModels(modelsData)
      setColors(colorsData)
      setRegistrationFees(fees)
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
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
    if (!modelId) { toast.error("Please select a model"); return }
    setSubmitting(true)
    try {
      let finalRegistrationFeeId: number | undefined = undefined
      if (useCustomFee && customFeeAmount) {
        const newFee = await registrationFeeApi.create({
          purpose: `Custom Fee - ${plateNumber}`,
          amount: Number(customFeeAmount),
          currency: "USD",
          companyId
        })
        finalRegistrationFeeId = newFee.id
      } else if (registrationFeeId) {
        finalRegistrationFeeId = Number(registrationFeeId)
      }

      await vehicleApi.create({
        companyId,
        ownerId: Number(ownerId),
        modelId: Number(modelId),
        plateNumber,
        vin: vin || undefined,
        colorId: colorId ? Number(colorId) : undefined,
        year: year || undefined,
        mileage: mileage || undefined,
        logbookNumber: logbookNumber || undefined,
        status,
        registrationFeeId: finalRegistrationFeeId
      })
      toast.success("Vehicle registered")
      setIsAddOpen(false)
      loadData()
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!modelId) { toast.error("Please select a model"); return }
    setSubmitting(true)
    try {
      let finalRegistrationFeeId: number | undefined = selected.registrationFeeId
      if (useCustomFee && customFeeAmount) {
        const newFee = await registrationFeeApi.create({
          purpose: `Custom Fee - ${plateNumber}`,
          amount: Number(customFeeAmount),
          currency: "USD",
          companyId
        })
        finalRegistrationFeeId = newFee.id
      } else if (registrationFeeId) {
        finalRegistrationFeeId = Number(registrationFeeId)
      } else {
        finalRegistrationFeeId = undefined
      }

      await vehicleApi.update(selected.id, {
        ownerId: Number(ownerId),
        modelId: Number(modelId),
        plateNumber,
        vin: vin || undefined,
        colorId: colorId ? Number(colorId) : undefined,
        year: year || undefined,
        mileage: mileage || undefined,
        logbookNumber: logbookNumber || undefined,
        status,
        registrationFeeId: finalRegistrationFeeId
      })
      toast.success("Vehicle updated")
      setIsEditOpen(false)
      loadData()
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await vehicleApi.delete(selected.id)
      toast.success("Vehicle deleted")
      setIsDeleteOpen(false)
      loadData()
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const openAdd = () => {
    setOwnerId(0)
    setBrandId("")
    setModelId("")
    setPlateNumber("")
    setVin("")
    setColorId("")
    setYear(new Date().getFullYear())
    setMileage(0)
    setLogbookNumber("")
    setStatus("ACTIVE")
    setRegistrationFeeId("")
    setCustomFeeAmount("")
    setUseCustomFee(false)
    setIsAddOpen(true)
  }

  const openEdit = (v: Vehicle) => {
    setSelected(v)
    setOwnerId(v.ownerId || 0)
    setBrandId(v.model?.brandId || "")
    setModelId(v.modelId || "")
    setPlateNumber(v.plateNumber)
    setVin(v.vin || "")
    setColorId(v.colorId || "")
    setYear(v.year || new Date().getFullYear())
    setMileage(v.mileage || 0)
    setLogbookNumber(v.logbookNumber || "")
    setStatus(v.status)
    setRegistrationFeeId(v.registrationFeeId || "")
    setCustomFeeAmount("")
    setUseCustomFee(false)
    setIsEditOpen(true)
  }

  const statusBadge: Record<string, string> = {
    ACTIVE: "bg-emerald-600 text-white",
    INACTIVE: "bg-rose-600 text-white",
    UNDER_INSPECTION: "bg-[#1565c0] text-white",
    BANNED: "bg-rose-900 text-white"
  }

  const filtered = vehicles.filter(v => {
    const s = search.toLowerCase()
    return (
      v.plateNumber.toLowerCase().includes(s) ||
      v.vin?.toLowerCase().includes(s) ||
      v.logbookNumber?.toLowerCase().includes(s) ||
      v.model?.name?.toLowerCase().includes(s) ||
      v.model?.brand?.name?.toLowerCase().includes(s) ||
      v.owner?.fullName?.toLowerCase().includes(s)
    ) && (statusFilter ? v.status === statusFilter : true)
  })

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  // Filter models based on selected brand
  const formModels = brandId ? models.filter(m => m.brandId === Number(brandId)) : []

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vehicles</h1>
        <p className={pageHeaderSubtitleClass}>Manage registered vehicles in the system</p>
      </div>

      {/* Unified Table & Controls Box Layout */}
      <div className={dashboardCardClass}>
        {/* Filters row inside the card */}
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium font-sans">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-9 px-2 border border-zinc-200 dark:border-border rounded bg-white dark:bg-muted/20 outline-none text-xs text-foreground"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-zinc-200 dark:border-border rounded text-xs bg-white dark:bg-muted/20 outline-none text-foreground">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" />
            </div>
            <Button onClick={openAdd} className={dashboardAddButtonClass}>
              <Plus className="size-4" /><span>Add Vehicle</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Plate Number", "Brand & Model", "Owner", "Logbook No", "VIN", "Year / Color", "Status", "Actions"].map(h => (
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
              ) : paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm font-bold text-foreground">{row.plateNumber}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold">
                      {row.model?.brand?.name ? `${row.model.brand.name} ${row.model.name}` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal">{row.owner?.fullName || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal">{row.logbookNumber || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}><span className="text-sm font-mono text-zinc-500">{row.vin || "—"}</span></TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-sm text-zinc-500 font-normal">
                      {row.year || "—"} / {row.color || "—"}
                    </span>
                  </TableCell>
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

        {/* Bottom pagination row */}
        {filtered.length > 0 && (
          <div className="px-5 py-4 border-t border-zinc-100 dark:border-border flex items-center justify-between bg-white dark:bg-card shrink-0 select-none">
            <div className="text-xs text-zinc-500 font-medium">
              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-0"
              >
                <span className="text-xs font-semibold">&lt;</span>
              </Button>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-bold px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-0"
              >
                <span className="text-xs font-semibold">&gt;</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8 overflow-y-auto max-h-[90vh]">
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
            
            <div><label className={labelCls}>Brand *</label>
              <select required value={brandId} onChange={(e) => { setBrandId(e.target.value === "" ? "" : Number(e.target.value)); setModelId("") }} className={selectCls}>
                <option value="">Select brand...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div><label className={labelCls}>Model *</label>
              <select required disabled={!brandId} value={modelId} onChange={(e) => setModelId(e.target.value === "" ? "" : Number(e.target.value))} className={selectCls}>
                <option value="">Select model...</option>
                {formModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div><label className={labelCls}>Plate Number *</label><input required type="text" placeholder="e.g. AB-1234" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Logbook Number (Buuga Aqoonsiga)</label><input type="text" placeholder="e.g. LG-987654" value={logbookNumber} onChange={(e) => setLogbookNumber(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Year</label><input type="number" placeholder="2024" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>Color</label>
              <select value={colorId} onChange={(e) => setColorId(e.target.value === "" ? "" : Number(e.target.value))} className={selectCls}>
                <option value="">Select color...</option>
                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Mileage (km)</label><input type="number" placeholder="0" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>VIN (Chassis No.)</label><input type="text" placeholder="Vehicle Identification Number" value={vin} onChange={(e) => setVin(e.target.value)} className={inputCls} /></div>

            <div className="col-span-2 space-y-3">
              <label className={labelCls}>Registration Fee</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="useCustomFee" checked={useCustomFee} onChange={(e) => { setUseCustomFee(e.target.checked); if (e.target.checked) setRegistrationFeeId("") }} className="w-4 h-4 accent-[#1565c0]" />
                  <label htmlFor="useCustomFee" className="text-sm font-normal text-zinc-700 dark:text-zinc-300">Enter custom amount</label>
                </div>
              </div>
              {!useCustomFee ? (
                <select value={registrationFeeId} onChange={(e) => setRegistrationFeeId(e.target.value === "" ? "" : Number(e.target.value))} className={selectCls}>
                  <option value="">Select registration fee (optional)</option>
                  {registrationFees.filter(f => f.isActive).map(f => (
                    <option key={f.id} value={f.id}>{f.purpose} - ${Number(f.amount).toFixed(2)}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-zinc-400" />
                  <input type="number" step="0.01" min="0" placeholder="Enter custom fee amount" value={customFeeAmount} onChange={(e) => setCustomFeeAmount(e.target.value)} className={inputCls} />
                </div>
              )}
            </div>

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
        <DialogContent className="max-w-3xl bg-white dark:bg-card border border-border rounded-lg p-8 overflow-y-auto max-h-[90vh]">
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

            <div><label className={labelCls}>Brand *</label>
              <select required value={brandId} onChange={(e) => { setBrandId(e.target.value === "" ? "" : Number(e.target.value)); setModelId("") }} className={selectCls}>
                <option value="">Select brand...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div><label className={labelCls}>Model *</label>
              <select required disabled={!brandId} value={modelId} onChange={(e) => setModelId(e.target.value === "" ? "" : Number(e.target.value))} className={selectCls}>
                <option value="">Select model...</option>
                {formModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div><label className={labelCls}>Plate Number *</label><input required type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Logbook Number (Buuga Aqoonsiga)</label><input type="text" value={logbookNumber} onChange={(e) => setLogbookNumber(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Year</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>Color</label>
              <select value={colorId} onChange={(e) => setColorId(e.target.value === "" ? "" : Number(e.target.value))} className={selectCls}>
                <option value="">Select color...</option>
                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Mileage (km)</label><input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>VIN (Chassis No.)</label><input type="text" value={vin} onChange={(e) => setVin(e.target.value)} className={inputCls} /></div>

            <div className="col-span-2 space-y-3">
              <label className={labelCls}>Registration Fee</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="useCustomFeeEdit" checked={useCustomFee} onChange={(e) => { setUseCustomFee(e.target.checked); if (e.target.checked) setRegistrationFeeId("") }} className="w-4 h-4 accent-[#1565c0]" />
                  <label htmlFor="useCustomFeeEdit" className="text-sm font-normal text-zinc-700 dark:text-zinc-300">Enter custom amount</label>
                </div>
              </div>
              {!useCustomFee ? (
                <select value={registrationFeeId} onChange={(e) => setRegistrationFeeId(e.target.value === "" ? "" : Number(e.target.value))} className={selectCls}>
                  <option value="">Select registration fee (optional)</option>
                  {registrationFees.filter(f => f.isActive).map(f => (
                    <option key={f.id} value={f.id}>{f.purpose} - ${Number(f.amount).toFixed(2)}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-zinc-400" />
                  <input type="number" step="0.01" min="0" placeholder="Enter custom fee amount" value={customFeeAmount} onChange={(e) => setCustomFeeAmount(e.target.value)} className={inputCls} />
                </div>
              )}
            </div>

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
              {[
                ["Plate Number", selected.plateNumber],
                ["Brand & Model", selected.model?.brand?.name ? `${selected.model.brand.name} ${selected.model.name}` : "—"],
                ["Owner", selected.owner?.fullName || "—"],
                ["Logbook Number (Buuga Aqoonsiga)", selected.logbookNumber || "—"],
                ["VIN (Chassis No)", selected.vin || "—"],
                ["Year of Manufacture", selected.year?.toString() || "—"],
                ["Color", selected.color || "—"],
                ["Mileage", selected.mileage ? `${selected.mileage.toLocaleString()} km` : "—"],
                ["Status", formatStatusLabel(selected.status)]
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
