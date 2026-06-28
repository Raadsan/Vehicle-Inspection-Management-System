"use client"

import React, { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, TagIcon, ChevronRight, Car } from "lucide-react"
import toast from "react-hot-toast"
import { vehicleBrandApi, vehicleModelApi, VehicleBrand, VehicleModel } from "@/lib/api"

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="font-semibold text-zinc-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BrandsModelsPage() {
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null)
  const [loading, setLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)

  // Brand modal state
  const [brandModal, setBrandModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: VehicleBrand }>({ open: false, mode: "create" })
  const [brandName, setBrandName] = useState("")
  const [brandSaving, setBrandSaving] = useState(false)

  // Model modal state
  const [modelModal, setModelModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: VehicleModel }>({ open: false, mode: "create" })
  const [modelName, setModelName] = useState("")
  const [modelYear, setModelYear] = useState("")
  const [modelSaving, setModelSaving] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "brand" | "model"; id: number; name: string } | null>(null)

  // Load brands
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

  // Load models for selected brand
  const loadModels = async (brandId: number) => {
    setModelsLoading(true)
    try {
      const data = await vehicleModelApi.getAll(brandId)
      setModels(data)
    } catch {
      toast.error("Failed to load models")
    } finally {
      setModelsLoading(false)
    }
  }

  useEffect(() => { loadBrands() }, [])

  useEffect(() => {
    if (selectedBrand) loadModels(selectedBrand.id)
    else setModels([])
  }, [selectedBrand])

  // ── Brand Actions ──
  const openBrandCreate = () => { setBrandName(""); setBrandModal({ open: true, mode: "create" }) }
  const openBrandEdit = (b: VehicleBrand) => { setBrandName(b.name); setBrandModal({ open: true, mode: "edit", data: b }) }

  const saveBrand = async () => {
    if (!brandName.trim()) return toast.error("Brand name is required")
    setBrandSaving(true)
    try {
      if (brandModal.mode === "create") {
        await vehicleBrandApi.create({ name: brandName.trim() })
        toast.success("Brand created!")
      } else if (brandModal.data) {
        await vehicleBrandApi.update(brandModal.data.id, { name: brandName.trim() })
        toast.success("Brand updated!")
        if (selectedBrand?.id === brandModal.data.id) setSelectedBrand((prev) => prev ? { ...prev, name: brandName.trim() } : prev)
      }
      setBrandModal({ open: false, mode: "create" })
      await loadBrands()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save brand")
    } finally {
      setBrandSaving(false)
    }
  }

  // ── Model Actions ──
  const openModelCreate = () => { setModelName(""); setModelYear(""); setModelModal({ open: true, mode: "create" }) }
  const openModelEdit = (m: VehicleModel) => { setModelName(m.name); setModelYear(m.year?.toString() || ""); setModelModal({ open: true, mode: "edit", data: m }) }

  const saveModel = async () => {
    if (!modelName.trim()) return toast.error("Model name is required")
    if (!selectedBrand) return
    setModelSaving(true)
    try {
      if (modelModal.mode === "create") {
        await vehicleModelApi.create({ brandId: selectedBrand.id, name: modelName.trim(), year: modelYear ? Number(modelYear) : undefined })
        toast.success("Model created!")
      } else if (modelModal.data) {
        await vehicleModelApi.update(modelModal.data.id, { name: modelName.trim(), year: modelYear ? Number(modelYear) : undefined })
        toast.success("Model updated!")
      }
      setModelModal({ open: false, mode: "create" })
      await loadModels(selectedBrand.id)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save model")
    } finally {
      setModelSaving(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.type === "brand") {
        await vehicleBrandApi.delete(deleteConfirm.id)
        toast.success("Brand deleted")
        if (selectedBrand?.id === deleteConfirm.id) setSelectedBrand(null)
        await loadBrands()
      } else {
        await vehicleModelApi.delete(deleteConfirm.id)
        toast.success("Model deleted")
        if (selectedBrand) await loadModels(selectedBrand.id)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete")
    } finally {
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <TagIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Brands & Models</h1>
            <p className="text-sm text-zinc-500">Manage vehicle makes and their models</p>
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Brands Column ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-zinc-800">Vehicle Makes</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{brands.length}</span>
            </div>
            <button
              onClick={openBrandCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Make
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : brands.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <TagIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No brands yet. Add your first brand.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    onClick={() => setSelectedBrand(selectedBrand?.id === brand.id ? null : brand)}
                    className={`flex items-center justify-between px-6 py-3.5 cursor-pointer transition-colors group ${
                      selectedBrand?.id === brand.id
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "hover:bg-zinc-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${selectedBrand?.id === brand.id ? "bg-blue-500 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                        {brand.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-800 text-sm">{brand.name}</p>
                        <p className="text-xs text-zinc-400">Click to view models</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openBrandEdit(brand) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit brand"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "brand", id: brand.id, name: brand.name }) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete brand"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className={`h-4 w-4 text-zinc-300 transition-transform ${selectedBrand?.id === brand.id ? "rotate-90 text-blue-400" : ""}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Models Column ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-violet-600" />
              <span className="font-semibold text-zinc-800">
                {selectedBrand ? `${selectedBrand.name} Models` : "Vehicle Models"}
              </span>
              {selectedBrand && (
                <span className="bg-violet-100 text-violet-700 text-xs font-medium px-2 py-0.5 rounded-full">{models.length}</span>
              )}
            </div>
            {selectedBrand && (
              <button
                onClick={openModelCreate}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Model
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {!selectedBrand ? (
              <div className="text-center py-12 text-zinc-400">
                <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a vehicle brand to see its models</p>
              </div>
            ) : modelsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No models yet for {selectedBrand.name}.</p>
                <button onClick={openModelCreate} className="mt-3 text-violet-600 text-sm hover:underline">Add first model</button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 group transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-800 text-sm">{model.name}</p>
                        {model.year && <p className="text-xs text-zinc-400">Year: {model.year}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openModelEdit(model)}
                        className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                        title="Edit model"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "model", id: model.id, name: model.name })}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete model"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Brand Modal ─── */}
      {brandModal.open && (
        <Modal title={brandModal.mode === "create" ? "Add Vehicle Make" : "Edit Vehicle Make"} onClose={() => setBrandModal({ open: false, mode: "create" })}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Brand Name *</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBrand()}
                placeholder="e.g. Toyota, Honda, BMW"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBrandModal({ open: false, mode: "create" })} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveBrand}
                disabled={brandSaving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {brandSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {brandModal.mode === "create" ? "Create Brand" : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Model Modal ─── */}
      {modelModal.open && (
        <Modal title={modelModal.mode === "create" ? `Add Model to ${selectedBrand?.name}` : "Edit Model"} onClose={() => setModelModal({ open: false, mode: "create" })}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Model Name *</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Corolla, Civic, 3-Series"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Year (optional)</label>
              <input
                type="number"
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
                placeholder="e.g. 2024"
                min="1900"
                max="2100"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModelModal({ open: false, mode: "create" })} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveModel}
                disabled={modelSaving}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {modelSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {modelModal.mode === "create" ? "Create Model" : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Delete Confirm ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">Delete {deleteConfirm.type === "brand" ? "Brand" : "Model"}?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
