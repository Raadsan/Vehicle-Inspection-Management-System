"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Bell, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"
import { auditLogApi, AuditLog } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  dashboardCardClass,
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui"

function formatDate(date: string) {
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function notificationTitle(log: AuditLog) {
  const entity = log.entity ? ` ${log.entity}` : ""
  return `${log.action}${entity}`.replace(/_/g, " ")
}

function getInitial(log: AuditLog) {
  const name = log.user?.fullName || log.user?.username || "System"
  return name.trim().charAt(0).toUpperCase()
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  if (diff >= week) return `${Math.max(1, Math.floor(diff / week))}w`
  if (diff >= day) return `${Math.max(1, Math.floor(diff / day))}d`
  if (diff >= hour) return `${Math.max(1, Math.floor(diff / hour))}h`
  if (diff >= minute) return `${Math.max(1, Math.floor(diff / minute))}m`
  return "now"
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [readIds, setReadIds] = useState<number[]>([])
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      setLogs(await auditLogApi.getAll({ limit: 100 }))
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error("Failed: " + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadData()
      try {
        setReadIds(JSON.parse(localStorage.getItem("readNotifications") || "[]"))
      } catch {
        setReadIds([])
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  const filtered = useMemo(() => {
    return logs
  }, [logs])

  const markRead = (id: number) => {
    const next = Array.from(new Set([...readIds, id]))
    setReadIds(next)
    localStorage.setItem("readNotifications", JSON.stringify(next))
  }

  const markAllRead = () => {
    const next = logs.map((log) => log.id)
    setReadIds(next)
    localStorage.setItem("readNotifications", JSON.stringify(next))
    toast.success("All notifications marked as read")
  }

  const unread = logs.filter((log) => !readIds.includes(log.id)).length

  return (
    <div className={cn(dashboardPageClass, "space-y-4")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Notifications</h1>
      </div>

      <div className={dashboardCardClass}>
        <div className="px-4 py-4 border-b border-zinc-100 dark:border-border flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[#0a2744] dark:text-white">Notification</h2>
            <p className="text-[11px] text-zinc-400 mt-1">{unread} unread · {logs.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={markAllRead} className="h-8 px-2 text-[11px] font-bold text-[#1565c0] hover:bg-[#1565c0]/5">
              Mark all read
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={loading} className="h-8 w-8">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-border">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="size-7 animate-spin mx-auto text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((log) => {
              const read = readIds.includes(log.id)
              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => { setSelected(log); markRead(log.id) }}
                  className={cn(
                    "w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[#1565c0]/5 dark:hover:bg-muted/10 transition-colors",
                    !read && "bg-[#1565c0]/[0.04]"
                  )}
                >
                  <div className={cn("size-4 rounded-full flex items-center justify-center shrink-0", read ? "text-emerald-500" : "text-[#1565c0]")}>
                    {read ? <CheckCircle2 className="size-3.5" /> : <Bell className="size-3.5" />}
                  </div>
                  <div className="size-10 rounded-full bg-gradient-to-br from-[#1565c0] to-[#0a2744] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {getInitial(log)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-tight">
                      <span className="font-bold text-[#0a2744] dark:text-white">{log.user?.fullName || log.user?.username || "System"}</span>{" "}
                      <span className="capitalize">{notificationTitle(log).toLowerCase()}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{log.details || "System activity recorded"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-zinc-400">{formatRelative(log.createdAt)}</span>
                    {!read && <span className="size-1.5 rounded-full bg-[#1565c0]" />}
                  </div>
                </button>
              )
            })
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">No notifications found</div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Notification Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {[
                ["Title", notificationTitle(selected)],
                ["Details", selected.details || "—"],
                ["Entity", selected.entity || "—"],
                ["User", selected.user?.fullName || selected.user?.username || "System"],
                ["Date", formatDate(selected.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-zinc-50 dark:bg-muted/20 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
                  <p className="font-semibold text-foreground mt-1">{value}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
