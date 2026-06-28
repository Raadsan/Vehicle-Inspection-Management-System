"use client"

import React, { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, TagIcon, Search } from "lucide-react"
import toast from "react-hot-toast"
import { vehicleBrandApi, VehicleBrand } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardCardClass, dashboardTableHeaderClass, dashboardTableHeadRowClass,
  dashboardTableHeadClass, dashboardTableBodyRowClass, dashboardTableCellClass, dashboardTableIdClass,
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
const textareaCls = "w-full min-h-24 px-3 py-2 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal text-foreground resize-y"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

export default function BrandsPage() {
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Brand modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null)

  const loadBrands = async () => {
    setLoading(true)
    try {
      const data = await vehicleBrandApi.getAll()
      setBrands(data)
    } catch {
      toast.error("Failed to load brands")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const openCreate = () => {
    setName("")
    setDescription("")
    setSelectedBrand(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const openEdit = (brand: VehicleBrand) => {
    setSelectedBrand(brand)
    setName(brand.name)
    setDescription(brand.description || "")
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error("Brand name is required")
    setSaving(true)
    try {
      if (modalMode === "create") {
        await vehicleBrandApi.create({ name: name.trim(), description: description.trim() || undefined })
        toast.success("Brand created successfully")
      } else if (selectedBrand) {
        await vehicleBrandApi.update(selectedBrand.id, { name: name.trim(), description: description.trim() || undefined })
        toast.success("Brand updated successfully")
      }
      setIsModalOpen(false)
      loadBrands()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save brand")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      await vehicleBrandApi.delete(deleteConfirm.id)
      toast.success("Brand deleted successfully")
      setDeleteConfirm(null)
      loadBrands()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete brand")
    } finally {
      setSaving(false)
    }
  }

  const filtered = brands.filter(b => {
    const s = search.toLowerCase()
    return b.name.toLowerCase().includes(s) || b.description?.toLowerCase().includes(s)
  })

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      {/* Header */}
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vehicle Brands</h1>
        <p className={pageHeaderSubtitleClass}>Manage car manufacturers and makes</p>
      </div>

      {/* Main card */}
      <div className={dashboardCardClass}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-border">
          <span className="text-sm font-semibold text-zinc-500">{filtered.length} of {brands.length} brands</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search brands..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-56 pl-9 pr-3 bg-white dark:bg-muted/20 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-[#1565c0] text-sm font-normal text-foreground" 
              />
            </div>
            <Button 
              onClick={openCreate} 
              className="h-10 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold px-5 rounded-md flex items-center gap-2 shadow-sm text-sm"
            >
              <Plus className="size-4.5" />
              <span>Add Brand</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                {["#", "Brand Name", "Description", "Created At", "Actions"].map(h => (
                  <TableHead key={h} className={cn(dashboardTableHeadClass, h === "Actions" ? "text-right" : "text-left")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground font-medium mt-2">Loading brands...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((brand, idx) => (
                  <TableRow key={brand.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{idx + 1}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TagIcon className="size-4 text-[#1565c0] shrink-0" />
                        {brand.name}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal line-clamp-1">
                        {brand.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-sm text-zinc-500 font-normal">
                        {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEdit(brand)} 
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded"
                          title="Edit Brand"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteConfirm({ id: brand.id, name: brand.name })} 
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 rounded"
                          title="Delete Brand"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-zinc-400 text-sm">No brands found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <CustomModal 
          title={modalMode === "create" ? "Add Vehicle Brand" : "Edit Vehicle Brand"} 
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={labelCls}>Brand Name *</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Toyota, BMW, Honda" 
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
                {modalMode === "create" ? "Create Brand" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <CustomModal 
          title="Delete Brand?" 
          onClose={() => setDeleteConfirm(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              Are you sure you want to delete brand <strong className="text-foreground dark:text-white">"{deleteConfirm.name}"</strong>? This will delete all models linked to this brand, and cannot be undone.
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
    </div>
  )
}
