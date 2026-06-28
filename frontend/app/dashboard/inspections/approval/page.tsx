"use client"

import React, { useState, useEffect } from "react"
import {
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardList,
  Car,
  User,
  Building2,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import toast from "react-hot-toast"
import { inspectionApi, Inspection } from "@/lib/api"

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AWAITING_APPROVAL: { label: "Awaiting Approval", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  APPROVED:          { label: "Approved",           className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  REJECTED:          { label: "Rejected",           className: "bg-red-50 text-red-700 border border-red-200" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: "bg-zinc-100 text-zinc-600" }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>
}

// ─── Approval Card ────────────────────────────────────────────────────────────
function InspectionCard({
  inspection,
  onApprove,
  onReject,
  processing,
}: {
  inspection: Inspection
  onApprove: (id: number, notes: string) => void
  onReject: (id: number, notes: string) => void
  processing: number | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState("")
  const isProcessing = processing === inspection.id

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800">Inspection #{inspection.id}</span>
              <StatusBadge status={inspection.status} />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-all">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Card Body */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vehicle */}
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <Car className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Vehicle</p>
            <p className="font-semibold text-zinc-800 text-sm">{inspection.vehicle?.plateNumber || "—"}</p>
            <p className="text-xs text-zinc-500">
              {inspection.vehicle?.model?.brand?.name} {inspection.vehicle?.model?.name} {inspection.vehicle?.year || ""}
            </p>
            {inspection.vehicle?.color && (
              <p className="text-xs text-zinc-400 capitalize">{inspection.vehicle.color}</p>
            )}
          </div>
        </div>

        {/* Inspector */}
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Inspector</p>
            <p className="font-semibold text-zinc-800 text-sm">{inspection.inspector?.fullName || "—"}</p>
            <p className="text-xs text-zinc-500">{inspection.inspector?.phone || ""}</p>
          </div>
        </div>

        {/* Company */}
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Company</p>
            <p className="font-semibold text-zinc-800 text-sm">{inspection.company?.name || "—"}</p>
            <p className="text-xs text-zinc-500">
              {inspection.overallResult && (
                <span className={`font-semibold ${inspection.overallResult === "PASS" ? "text-emerald-600" : "text-red-600"}`}>
                  Result: {inspection.overallResult}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded: Notes + Action */}
      {expanded && (
        <div className="px-6 pb-5 border-t border-zinc-50 pt-4 space-y-4">
          {/* Existing notes */}
          {inspection.notes && (
            <div className="p-3 bg-zinc-50 rounded-xl text-sm text-zinc-600">
              <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Inspection Notes</p>
              {inspection.notes}
            </div>
          )}

          {/* Actions (only for AWAITING_APPROVAL) */}
          {inspection.status === "AWAITING_APPROVAL" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Admin Note (optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note for the company (reason for rejection, etc.)"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onReject(inspection.id, notes)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
                <button
                  onClick={() => onApprove(inspection.id, notes)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApprovalPage() {
  const [tab, setTab] = useState<"awaiting" | "approved" | "rejected">("awaiting")
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const statusMap = { awaiting: "AWAITING_APPROVAL", approved: "APPROVED", rejected: "REJECTED" }
      const data = await inspectionApi.getAll({ status: statusMap[tab] })
      setInspections(data)
    } catch {
      toast.error("Failed to load inspections")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  const handleApprove = async (id: number, notes: string) => {
    setProcessing(id)
    try {
      await inspectionApi.approve(id, notes)
      toast.success("Inspection approved! ✅")
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to approve")
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: number, notes: string) => {
    setProcessing(id)
    try {
      await inspectionApi.reject(id, notes)
      toast.success("Inspection rejected")
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to reject")
    } finally {
      setProcessing(null)
    }
  }

  const tabs = [
    { key: "awaiting", label: "Awaiting Approval", icon: Clock, color: "amber" },
    { key: "approved", label: "Approved", icon: CheckCircle, color: "emerald" },
    { key: "rejected", label: "Rejected", icon: XCircle, color: "red" },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-orange-50/10 p-6">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Inspection Approvals</h1>
            <p className="text-sm text-zinc-500">Review and approve completed vehicle inspections</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white border border-zinc-100 rounded-xl p-1 w-fit mb-6 shadow-sm">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? key === "awaiting"
                  ? "bg-amber-500 text-white shadow-sm"
                  : key === "approved"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-red-600 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100 shadow-sm">
          <CheckCircle className="h-14 w-14 mx-auto mb-4 text-zinc-200" />
          <p className="font-semibold text-zinc-600 text-lg">
            {tab === "awaiting" ? "No inspections awaiting approval" : `No ${tab} inspections`}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {tab === "awaiting"
              ? "Inspections completed by companies will appear here for your review."
              : "Processed inspections will show here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              onApprove={handleApprove}
              onReject={handleReject}
              processing={processing}
            />
          ))}
        </div>
      )}
    </div>
  )
}
