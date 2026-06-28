"use client"

import React, { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, Search, TagIcon, MoreVertical } from "lucide-react"
import toast from "react-hot-toast"
import { vehicleBrandApi, VehicleBrand } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass, dashboardPageStyle, pageHeaderTitleClass, pageHeaderSubtitleClass,
  pageHeaderWrapperClass, dashboardAddButtonClass,
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

// ─── Brand Menu (Kebab Dropdown) ───
function BrandMenu({
  brand,
  onEdit,
  onDelete,
}: {
  brand: VehicleBrand
  onEdit: (b: VehicleBrand) => void
  onDelete: (b: VehicleBrand) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-lg shadow-xl w-36 py-1 overflow-hidden">
            <button
              onClick={() => { setOpen(false); onEdit(brand) }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 w-full text-left transition-colors font-medium"
            >
              <Edit className="size-3.5 text-blue-500" /> Edit Brand
            </button>
            <button
              onClick={() => { setOpen(false); onDelete(brand) }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left transition-colors font-bold"
            >
              <Trash2 className="size-3.5" /> Delete Brand
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Brand Card ───
function BrandCard({
  brand,
  onEdit,
  onDelete,
}: {
  brand: VehicleBrand
  onEdit: (b: VehicleBrand) => void
  onDelete: (b: VehicleBrand) => void
}) {
  return (
    <div className="bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between h-[185px]">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1565c0]/10 flex items-center justify-center shrink-0">
              <TagIcon className="size-5 text-[#1565c0]" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate max-w-[120px]">{brand.name}</h3>
              {brand.createdAt && (
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Created: {new Date(brand.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <BrandMenu brand={brand} onEdit={onEdit} onDelete={onDelete} />
        </div>

        {brand.description ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 line-clamp-2">
            {brand.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-400/50 italic mt-3">No description provided</p>
        )}
      </div>

      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onEdit(brand)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-zinc-200 dark:border-border rounded-lg text-xs text-zinc-600 dark:text-zinc-300 hover:bg-[#1565c0] hover:text-white hover:border-[#1565c0] font-bold transition-all"
        >
          <Edit className="size-3.5" />
          Edit Brand
        </button>
      </div>
    </div>
  )
}

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      {/* Header with Search and Add Brand Button */}
      <div className={cn(pageHeaderWrapperClass, "flex flex-wrap items-end justify-between gap-4 mb-6")}>
        <div>
          <h1 className={pageHeaderTitleClass}>Vehicle Brands</h1>
          <p className={pageHeaderSubtitleClass}>Manage car manufacturers and makes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search brands..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-52 pl-8 pr-3 bg-white dark:bg-muted/10 border border-zinc-200 dark:border-border rounded-lg outline-none text-xs text-foreground font-normal focus:border-[#1565c0] transition-colors" 
            />
          </div>
          <button
            onClick={openCreate}
            className={dashboardAddButtonClass}
          >
            <Plus className="size-4" />
            Add Brand
          </button>
        </div>
      </div>

      {/* Top filters row for page size */}
      <div className="flex items-center gap-1.5 mb-4">
        
      </div>

      {/* Brand Boxes/Cards Grid directly on background */}
      {loading ? (
        <div className="py-20 text-center bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-lg shadow-xs">
          <Loader2 className="size-8 animate-spin mx-auto text-[#1565c0]" />
          <p className="text-sm text-muted-foreground font-medium mt-2">Loading brands...</p>
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map((brand) => (
            <BrandCard 
              key={brand.id}
              brand={brand}
              onEdit={openEdit}
              onDelete={(b) => setDeleteConfirm({ id: b.id, name: b.name })}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-zinc-400 text-sm bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-lg shadow-xs">No brands found</div>
      )}

      {/* Pagination controls at the bottom */}
      

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
                className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal text-[#0a2744]"
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
