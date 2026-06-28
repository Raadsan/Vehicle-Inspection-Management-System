"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings2,
  Menu,
} from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Page title map ───────────────────────────────────────────────────────────
function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname.startsWith("/dashboard/inspections/create")) return "Schedule Inspection"
  if (pathname.startsWith("/dashboard/inspections/items")) return "Inspection Items"
  if (pathname.startsWith("/dashboard/inspections/results")) return "Inspection Results"
  if (pathname.startsWith("/dashboard/inspections/approval")) return "Awaiting Approval"
  if (pathname.startsWith("/dashboard/inspections")) return "Inspections"
  if (pathname.startsWith("/dashboard/vehicles/create")) return "Add Vehicle"
  if (pathname.startsWith("/dashboard/vehicles")) return "Vehicles"
  if (pathname.startsWith("/dashboard/brands")) return "Brands"
  if (pathname.startsWith("/dashboard/models")) return "Models"
  if (pathname.startsWith("/dashboard/inspectors")) return "Inspectors"
  if (pathname.startsWith("/dashboard/owners")) return "Vehicle Owners"
  if (pathname.startsWith("/dashboard/companies")) return "Companies"
  if (pathname.startsWith("/dashboard/payments/customers")) return "Customer Payments"
  if (pathname.startsWith("/dashboard/payments/inspectors")) return "Inspector Payments"
  if (pathname.startsWith("/dashboard/payments/invoices")) return "Invoices"
  if (pathname.startsWith("/dashboard/payments/transactions")) return "Transactions"
  if (pathname.startsWith("/dashboard/payments")) return "Payments"
  if (pathname.startsWith("/dashboard/reports")) return "Reports"
  if (pathname.startsWith("/dashboard/analytics")) return "Analytics"
  if (pathname.startsWith("/dashboard/users")) return "Users"
  if (pathname.startsWith("/dashboard/configuration/role-permissions")) return "Role Permissions"
  if (pathname.startsWith("/dashboard/configuration/audit-log")) return "Audit Log"
  if (pathname.startsWith("/dashboard/configuration/roles")) return "Roles"
  if (pathname.startsWith("/dashboard/configuration")) return "Configuration"
  if (pathname.startsWith("/dashboard/settings")) return "Settings"
  if (pathname.startsWith("/dashboard/help")) return "Help"
  return "Dashboard"
}

interface StoredUser {
  username: string
  fullName?: string
  role?: string
  email?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const [user, setUser] = useState<StoredUser | null>(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    // Read user from localStorage (set at login)
    try {
      const stored = localStorage.getItem("user")
      if (stored) setUser(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() ?? "U"

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
    >
      <AppSidebar />

      <SidebarInset className="bg-[#f4f7fb] dark:bg-[#0f1117]">
        {/* ─── Top Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border bg-white/90 dark:bg-[#131923]/95 backdrop-blur-md shadow-sm">
          <div className="flex h-14 lg:h-[64px] items-center gap-3 px-4 lg:px-6">
            {/* Sidebar toggle + page title */}
            <div className="flex items-center gap-3 shrink-0">
              <SidebarTrigger className="size-9 rounded-lg border border-border/60 bg-white dark:bg-slate-900 text-muted-foreground shadow-xs hover:text-primary hover:border-primary/30 transition-colors" />
            </div>

            {/* Center search (desktop) */}
            <div className="hidden lg:flex flex-1 justify-center max-w-lg mx-auto">
              <div className="relative w-full group">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search vehicles, inspections, owners…"
                  className="w-full h-9 pl-9 pr-4 text-xs bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background rounded-full focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 lg:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mobile search */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-full"
                onClick={() => setMobileSearchOpen((v) => !v)}
              >
                <Search className="size-4 text-muted-foreground" />
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="size-4.5 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-green-500 ring-2 ring-background" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 mt-2 rounded-xl shadow-xl" align="end">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Notifications</p>
                  </div>
                  <div className="p-6 text-center">
                    <Bell className="size-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      No new notifications
                    </p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none group cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shadow-sm transition-all group-hover:ring-2 group-hover:ring-primary/30"
                      style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
                    >
                      {initials}
                    </div>
                    <div className="hidden xl:flex flex-col items-start text-left">
                      <span className="text-[12px] font-bold text-foreground leading-tight">
                        {user?.fullName ?? user?.username ?? "User"}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {user?.role ?? "Staff"}
                      </span>
                    </div>
                    <ChevronDown className="hidden xl:block size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 rounded-xl shadow-xl" align="end">
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
                      >
                        {initials}
                      </div>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-bold truncate">{user?.fullName ?? user?.username}</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{user?.role}</span>
                        <span className="text-[10px] text-muted-foreground/70 truncate">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center text-xs font-semibold py-2 cursor-pointer">
                        <UserIcon className="mr-2 size-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center text-xs font-semibold py-2 cursor-pointer">
                        <Settings2 className="mr-2 size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 text-xs font-semibold py-2 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 size-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile search row */}
          {mobileSearchOpen && (
            <div className="lg:hidden border-t border-border px-4 py-2.5">
              <div className="relative w-full group">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search…"
                  autoFocus
                  className="w-full h-9 pl-9 pr-4 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/30"
                />
              </div>
            </div>
          )}
        </header>

        {/* ─── Page Content ───────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto">
          <div className="py-5 px-4 lg:px-6 w-full mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
