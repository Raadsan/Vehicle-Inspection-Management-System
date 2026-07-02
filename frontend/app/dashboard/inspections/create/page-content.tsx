"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, ClipboardList } from "lucide-react"
import toast from "react-hot-toast"
import {
  inspectionApi,
  inspectionTemplateItemApi,
  vehicleApi,
  userApi,
  Vehicle,
  User,
  Company,
  InspectionTemplateItem,
  InspectionItemPayload,
  Inspection,
} from "@/lib/api"
import { getStoredUser, isCompanyUser, isDowladaUser, type StoredUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
  dashboardCardClass,
} from "@/lib/dashboard-ui"

const inputCls =
  "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const selectCls =
  "w-full h-10 px-3 border border-zinc-200 dark:border-border rounded-md outline-none text-sm bg-white dark:bg-muted/10 focus:border-[#1565c0] transition-all font-normal"
const labelCls = "block text-sm font-semibold text-[#0a2744] dark:text-zinc-300 mb-1"

type OrgType = "" | "dowlada" | "company"
type ItemResultMap = Record<number, "PASS" | "FAIL">

function isSystemUserRole(role?: string) {
  const normalized = String(role || "").toLowerCase().replace(/[\s_-]+/g, "")
  return normalized === "admin" || normalized === "superadmin"
}

function PassFailToggle({
  value,
  onChange,
}: {
  value: "PASS" | "FAIL"
  onChange: (v: "PASS" | "FAIL") => void
}) {
  const isPass = value === "PASS"
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("FAIL")}
        className={cn(
          "h-8 px-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
          !isPass
            ? "bg-rose-600 text-white shadow-sm"
            : "bg-zinc-100 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:bg-muted/30"
        )}
      >
        Fail
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={isPass}
        onClick={() => onChange(isPass ? "FAIL" : "PASS")}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          isPass ? "bg-emerald-500" : "bg-rose-500"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform",
            isPass ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
      <button
        type="button"
        onClick={() => onChange("PASS")}
        className={cn(
          "h-8 px-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
          isPass
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-zinc-100 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-muted/30"
        )}
      >
        Pass
      </button>
    </div>
  )
}

export default function ScheduleInspectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const completeId = searchParams.get("complete")

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [templateItems, setTemplateItems] = useState<InspectionTemplateItem[]>([])
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [vehicleId, setVehicleId] = useState<number>(0)
  const [orgType, setOrgType] = useState<OrgType>("")
  const [selectedUserId, setSelectedUserId] = useState<number | "">("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [notes, setNotes] = useState("")
  const [itemResults, setItemResults] = useState<ItemResultMap>({})
  const [companyId, setCompanyId] = useState<number>(1)

  const user = currentUser ?? getStoredUser()
  const companyLocked = isCompanyUser(user)
  const dowladaLocked = isDowladaUser(user)
  const isCompleting = Boolean(completeId)
  // System users only — exclude company owners/inspectors
  const systemUsers = users.filter(
    (u) => u.isActive && isSystemUserRole(u.role)
  )
  const [userSearch, setUserSearch] = useState("")
  const [showUserList, setShowUserList] = useState(false)

  const selectedUserDisplay = systemUsers.find((u) => u.id === Number(selectedUserId))
  const filteredSystemUsers = systemUsers.filter((u) => {
    const q = userSearch.toLowerCase()
    if (!q) return true
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    )
  })

  const applyCompanyDefaults = (u: StoredUser) => {
    setOrgType("company")
    setSelectedCompanyId(u.companyId)
    setSelectedUserId(u.id)
  }

  const applyDowladaDefaults = (u: StoredUser) => {
    setOrgType("dowlada")
    setSelectedUserId(u.id)
    setSelectedCompanyId("")
  }

  const resolveScheduleCompanyId = (): number => {
    if (companyLocked && user?.companyId) return Number(user.companyId)
    if (orgType === "company" && selectedCompanyId) return Number(selectedCompanyId)
    if (dowladaLocked && selectedUserId) {
      const u = users.find((x) => x.id === Number(selectedUserId))
      return u?.companyId ?? companyId
    }
    return companyId
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const u = getStoredUser()
      setCurrentUser(u)
      if (u?.companyId) setCompanyId(Number(u.companyId))
      if (u && isCompanyUser(u)) applyCompanyDefaults(u)
      else if (u && isDowladaUser(u)) applyDowladaDefaults(u)

      const load = async () => {
        setLoading(true)
        try {
          const [vehiclesData, itemsData, inspectionsData] = await Promise.all([
            vehicleApi.getAll(),
            inspectionTemplateItemApi.getAll(),
            inspectionApi.getAll(),
          ])

          let existingVehicleId = 0
          if (completeId) {
            const existing = await inspectionApi.getById(Number(completeId))
            existingVehicleId = existing.vehicleId
            setVehicleId(existing.vehicleId)
            setScheduledAt(existing.scheduledAt ? existing.scheduledAt.slice(0, 16) : "")
            setNotes(existing.notes || "")
            if (existing.companyId) {
              setOrgType("company")
              setSelectedCompanyId(existing.companyId)
            }
          }

          const busyVehicleIds = new Set(
            (inspectionsData as Inspection[])
              .filter((i) =>
                ["PENDING", "IN_PROGRESS", "AWAITING_APPROVAL"].includes(i.status) &&
                String(i.id) !== completeId
              )
              .map((i) => i.vehicleId)
          )

          setVehicles(
            (vehiclesData as Vehicle[]).filter(
              (v) => !busyVehicleIds.has(v.id) || v.id === existingVehicleId
            )
          )

          const items = (itemsData as InspectionTemplateItem[]).filter((i) => i.isActive)
          setTemplateItems(items)
          const defaults: ItemResultMap = {}
          items.forEach((item) => {
            defaults[item.id] = "PASS"
          })
          setItemResults(defaults)

          if (dowladaLocked && !companyLocked) {
            const usersData = await userApi.getAll()
            setUsers(
              (usersData as User[]).filter(
                (u) => u.isActive && isSystemUserRole(u.role)
              )
            )
          } else if (u) {
            setUsers([u as User])
            setCompanies(
              u.companyName ? [{ id: u.companyId, name: u.companyName, isActive: true } as Company] : []
            )
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to load data"
          toast.error(message)
        } finally {
          setLoading(false)
        }
      }
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [completeId])

  const buildItemsPayload = (): InspectionItemPayload[] =>
    templateItems.map((item, index) => ({
      itemName: item.name,
      category: "General",
      sortOrder: item.sortOrder ?? index,
      result: itemResults[item.id] || "PASS",
    }))

  const computedOverallResult = useMemo((): "PASS" | "FAIL" => {
    if (templateItems.length === 0) return "PASS"
    return templateItems.some((item) => (itemResults[item.id] || "PASS") === "FAIL")
      ? "FAIL"
      : "PASS"
  }, [templateItems, itemResults])

  const validateOrgFields = (): boolean => {
    if (!vehicleId) {
      toast.error("Select a vehicle")
      return false
    }
    if (companyLocked) return true
    if (dowladaLocked) {
      if (!selectedUserId) {
        toast.error("Select a user")
        return false
      }
      return true
    }
    if (!orgType) {
      toast.error("Select Dowlada or Company")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateOrgFields()) return
    if (templateItems.length === 0) {
      toast.error("No inspection items configured. Add items first.")
      return
    }

    const items = buildItemsPayload()
    setSubmitting(true)
    try {
      if (completeId) {
        await inspectionApi.complete(Number(completeId), { items, notes: notes || undefined })
      } else {
        await inspectionApi.create({
          companyId: resolveScheduleCompanyId(),
          vehicleId: Number(vehicleId),
          scheduledAt: scheduledAt || undefined,
          notes: notes || undefined,
          overallResult: computedOverallResult,
          items,
        })
      }
      toast.success("Inspection saved successfully")
      router.push("/dashboard/inspections")
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (ax.response?.data?.error || ax.message))
    } finally {
      setSubmitting(false)
    }
  }

  const lockedInputCls = cn(selectCls, "bg-zinc-50 dark:bg-muted/30 cursor-not-allowed")

  if (loading) {
    return (
      <div className={cn(dashboardPageClass, "flex items-center justify-center min-h-[50vh]")} style={dashboardPageStyle}>
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-5")} style={dashboardPageStyle}>
      <div className={cn(pageHeaderWrapperClass, "flex flex-wrap items-start justify-between gap-4")}>
        <div>
          <Link
            href="/dashboard/inspections"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-primary mb-2 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Inspections
          </Link>
          <h1 className={pageHeaderTitleClass}>
            {isCompleting ? "Complete Vehicle Inspection" : "Schedule Vehicle Inspection"}
          </h1>
          <p className={pageHeaderSubtitleClass}>
            Select vehicle details and mark each inspection item Pass or Fail
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className={cn(dashboardCardClass, "p-6")}>
          <h2 className="text-sm font-bold text-[#0a2744] dark:text-white mb-4 uppercase tracking-wider">
            Inspection Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(Number(e.target.value))}
                className={selectCls}
                disabled={isCompleting}
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber}
                    {v.model?.name ? ` — ${v.model.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Overall Result</label>
              <select
                value={computedOverallResult}
                onChange={(e) => {
                  const value = e.target.value as "PASS" | "FAIL"
                  if (value === "PASS") {
                    setItemResults((prev) => {
                      const next = { ...prev }
                      templateItems.forEach((item) => {
                        next[item.id] = "PASS"
                      })
                      return next
                    })
                  } else {
                    const first = templateItems[0]
                    if (first) {
                      setItemResults((prev) => ({ ...prev, [first.id]: "FAIL" }))
                    }
                  }
                }}
                className={selectCls}
                disabled={templateItems.length === 0}
              >
                <option value="PASS">Pass (OK)</option>
                <option value="FAIL">Fail</option>
              </select>
            </div>

            {companyLocked && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Inspector Type</label>
                  <input disabled value="Company" className={lockedInputCls} />
                </div>
                <div>
                  <label className={labelCls}>User</label>
                  <input
                    disabled
                    value={currentUser?.fullName || currentUser?.username || ""}
                    className={lockedInputCls}
                  />
                </div>
              </div>
            )}

            {dowladaLocked && !companyLocked && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Inspector Type</label>
                  <input type="text" readOnly value="Dowlada" className={lockedInputCls} />
                </div>
                <div className="relative">
                  <label className={labelCls}>User / Admin *</label>
                  <input
                    type="text"
                    required
                    value={userSearch || (selectedUserDisplay ? `${selectedUserDisplay.fullName || selectedUserDisplay.username}${isSystemUserRole(selectedUserDisplay.role) ? " (Admin)" : ""}` : "")}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      setSelectedUserId("")
                      setShowUserList(true)
                    }}
                    onFocus={() => setShowUserList(true)}
                    placeholder="Type to search system users..."
                    className={inputCls}
                  />
                  {showUserList && filteredSystemUsers.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserList(false)} />
                      <ul className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-md shadow-lg">
                        {filteredSystemUsers.map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-[#1565c0]/10 transition-colors"
                              onClick={() => {
                                setSelectedUserId(u.id)
                                setUserSearch("")
                                setShowUserList(false)
                              }}
                            >
                              {u.fullName || u.username}
                              {isSystemUserRole(u.role) ? " (Admin)" : ""}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className={labelCls}>Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className={inputCls}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard/inspections")}
                className="h-10 px-4 rounded-md border border-zinc-200 text-sm font-normal shrink-0"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={submitting || templateItems.length === 0 || !vehicleId}
                className="h-10 px-8 bg-[#1565c0] hover:bg-[#0a2744] text-white font-semibold rounded-md text-sm flex items-center gap-2 shrink-0"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Save Inspection
              </Button>
            </div>
          </div>
        </div>

        <div className={cn(dashboardCardClass, "p-6")}>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="size-5 text-[#1565c0]" />
            <h2 className="text-sm font-bold text-[#0a2744] dark:text-white uppercase tracking-wider">
              Inspection Items ({templateItems.length})
            </h2>
          </div>

          {templateItems.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 text-center">
              No active inspection items. Configure them under Inspection Items.
            </p>
          ) : (
            <div className="space-y-2 pb-6">
              {templateItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-lg border border-zinc-100 dark:border-border bg-zinc-50/50 dark:bg-muted/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-zinc-400 w-6 shrink-0">{idx + 1}</span>
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <PassFailToggle
                    value={itemResults[item.id] || "PASS"}
                    onChange={(v) => setItemResults((prev) => ({ ...prev, [item.id]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
