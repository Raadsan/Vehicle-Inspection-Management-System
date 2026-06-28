"use client"

import React, { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, Search, Eye } from "lucide-react"
import toast from "react-hot-toast"
import { vehicleModelApi, vehicleBrandApi, VehicleModel, VehicleBrand } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
  dashboardAddButtonClass,
} from "@/lib/dashboard-ui"

// ─── Simple Modal ───
function CustomModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-card rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 dark:border-border">
          <h3 className="font-bold text-zinc-900 dark:text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl leading-none transition-colors">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

const inputCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const selectCls = "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground"
const textareaCls = "w-full min-h-24 px-3 py-2 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground resize-y"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

export default function ModelsPage() {
  const [models, setModels] = useState<VehicleModel[]>([])
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Model modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null)
  const [name, setName] = useState("")
  const [brandId, setBrandId] = useState<number | "">("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null)

  // View modal
  const [isViewOpen, setIsViewOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [modelsData, brandsData] = await Promise.all([
        vehicleModelApi.getAll(),
        vehicleBrandApi.getAll()
      ])
      setModels(modelsData)
      setBrands(brandsData)
    } catch {
      toast.error("Failed to load models or brands")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setName("")
    setBrandId("")
    setDescription("")
    setSelectedModel(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const openEdit = (model: VehicleModel) => {
    setSelectedModel(model)
    setName(model.name)
    setBrandId(model.brandId)
    setDescription(model.description || "")
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error("Model name is required")
    if (!brandId) return toast.error("Please select a brand")
    setSaving(true)
    try {
      if (modalMode === "create") {
        await vehicleModelApi.create({
          brandId: Number(brandId),
          name: name.trim(),
          description: description.trim() || undefined
        })
        toast.success("Model created successfully")
      } else if (selectedModel) {
        await vehicleModelApi.update(selectedModel.id, {
          name: name.trim(),
          description: description.trim() || undefined
        })
        toast.success("Model updated successfully")
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save model")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      await vehicleModelApi.delete(deleteConfirm.id)
      toast.success("Model deleted successfully")
      setDeleteConfirm(null)
      loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete model")
    } finally {
      setSaving(false)
    }
  }

  const filtered = models.filter(m => {
    const s = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(s) ||
      m.brand?.name.toLowerCase().includes(s) ||
      m.description?.toLowerCase().includes(s) ||
      m.createdBy?.toLowerCase().includes(s)
    )
  })

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      {/* Header */}
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vehicle Models</h1>
        <p className={pageHeaderSubtitleClass}>Manage models linked to manufacturers</p>
      </div>

      {/* Main card wrapper containing table and bottom pagination */}
      <div className={dashboardCardClass}>
        {/* Filters row inside the card */}
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium">Show</span>
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 pl-8 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded outline-none text-xs text-foreground" 
              />
            </div>
            <Button onClick={openCreate} className={dashboardAddButtonClass}>
              <Plus className="size-4" />
              <span>Add Model</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["NO", "Model Name", "Brand", "Description", "Created By", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground font-medium mt-2">Loading models...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((model, idx) => (
                  <TableRow key={model.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{(currentPage - 1) * pageSize + idx + 1}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-bold text-foreground">
                        {model.name}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold">
                        {model.brand?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal line-clamp-1">
                        {model.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-500 font-normal">
                        {model.createdBy || "—"}
                      </span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedModel(model); setIsViewOpen(true) }}
                          className="h-8 w-8 text-primary hover:bg-primary/5 rounded"
                          title="View Model"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(model)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"
                          title="Edit Model"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ id: model.id, name: model.name })}
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"
                          title="Delete Model"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-zinc-400 text-sm">No models found</TableCell>
                </TableRow>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <CustomModal 
          title={modalMode === "create" ? "Add Vehicle Model" : "Edit Vehicle Model"} 
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={labelCls}>Brand / Make *</label>
              {modalMode === "create" ? (
                <select 
                  required 
                  value={brandId} 
                  onChange={(e) => setBrandId(e.target.value === "" ? "" : Number(e.target.value))} 
                  className={selectCls}
                >
                  <option value="">Select brand...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <input 
                  disabled 
                  type="text" 
                  value={selectedModel?.brand?.name || ""} 
                  className={cn(inputCls, "bg-zinc-50 dark:bg-muted/30 cursor-not-allowed")} 
                />
              )}
            </div>
            <div>
              <label className={labelCls}>Model Name *</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Corolla, Civic, X5" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className={inputCls} 
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea 
                placeholder="Enter description..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className={textareaCls} 
              />
            </div>
            <div className="pt-2 flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsModalOpen(false)} 
                className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="h-10 px-5 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {modalMode === "create" ? "Create Model" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <CustomModal 
          title="Delete Model?" 
          onClose={() => setDeleteConfirm(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              Are you sure you want to delete model <strong className="text-foreground dark:text-white">"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div className="pt-2 flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setDeleteConfirm(null)} 
                className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal text-zinc-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={saving} 
                className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md text-sm flex items-center gap-2"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </CustomModal>
      )}

      {/* View Modal */}
      {isViewOpen && selectedModel && (
        <CustomModal 
          title="Model Details" 
          onClose={() => setIsViewOpen(false)}
        >
          <div className="space-y-3">
            {[
              ["Model Name", selectedModel.name],
              ["Brand", selectedModel.brand?.name || "—"],
              ["Description", selectedModel.description || "—"],
              ["Created By", selectedModel.createdBy || "—"],
              ["Created At", selectedModel.createdAt ? new Date(selectedModel.createdAt).toLocaleString() : "—"],
            ].map(([l, v]) => (
              <div key={l} className="flex items-start justify-between border-b border-zinc-100 dark:border-border pb-2.5 gap-4">
                <span className="text-sm text-zinc-400 font-normal shrink-0">{l}</span>
                <span className="text-sm text-zinc-800 dark:text-zinc-200 font-semibold text-right">{v}</span>
              </div>
            ))}
            <div className="pt-2 flex justify-end">
              <Button onClick={() => setIsViewOpen(false)} className="h-10 px-5 bg-[#1565c0] text-white font-semibold rounded-md text-sm">Close</Button>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  )
}
