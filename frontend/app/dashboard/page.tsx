"use client"

import React, { useState, useEffect } from "react"
import {
  Briefcase,
  DollarSign,
  Clock,
  Car,
  Wrench,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  ClipboardList,
  Users,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
  dashboardCardClass,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableIdClass,
  dashboardStatusBadgeClass,
  getOrderStatusBadgeClass,
  formatStatusLabel,
  dashboardStatIconClass,
  chartPrimary,
  chartPrimaryVariants,
  chartTooltipStyle,
  chartAxisTick,
} from "@/lib/dashboard-ui"
import { dashboardApi, DashboardStats } from "@/lib/api"
import { getStoredUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

// ─── Blue Color Palette definitions for Charts ────────────────────────────────
const bluePalette = {
  darkNavy: "#0a2744",
  primaryBlue: "#1565c0",
  skyBlue: "#2196f3",
  lightBlue: "#4fc3f7",
  paleBlue: "#90caf9",
}

const blueVariants = [
  bluePalette.darkNavy,
  bluePalette.primaryBlue,
  bluePalette.skyBlue,
  bluePalette.lightBlue,
  bluePalette.paleBlue,
]

// ─── Stat Cards Config (values loaded from API in component) ─────────────────

// ─── Recharts Data ────────────────────────────────────────────────────────────
const weeklyAnalytics = [
  { name: "Mon", revenue: 2400, inspections: 120 },
  { name: "Tue", revenue: 3600, inspections: 180 },
  { name: "Wed", revenue: 3000, inspections: 150 },
  { name: "Thu", revenue: 4500, inspections: 220 },
  { name: "Fri", revenue: 4000, inspections: 200 },
  { name: "Sat", revenue: 5200, inspections: 260 },
  { name: "Sun", revenue: 3800, inspections: 190 },
]

const monthlyTrends = [
  { name: "Jan", total: 400, passed: 320, failed: 80 },
  { name: "Feb", total: 450, passed: 370, failed: 80 },
  { name: "Mar", total: 520, passed: 410, failed: 110 },
  { name: "Apr", total: 490, passed: 390, failed: 100 },
  { name: "May", total: 610, passed: 500, failed: 110 },
  { name: "Jun", total: 680, passed: 560, failed: 120 },
]

const vehicleCategoryData = [
  { name: "Sedan", value: 450 },
  { name: "SUV", value: 300 },
  { name: "Truck", value: 200 },
  { name: "Motorcycle", value: 150 },
]

// ─── Recent Inspections Data ──────────────────────────────────────────────────
const initialInspections = [
  {
    id: "INS-001",
    vehicle: "Toyota Camry 2022",
    plate: "ABC-1234",
    inspector: "Alice Inspector",
    status: "COMPLETED",
    date: "2024-09-15",
    total: 80,
  },
  {
    id: "INS-002",
    vehicle: "Honda Civic 2021",
    plate: "XYZ-5678",
    inspector: "Bob Technician",
    status: "PENDING",
    date: "2024-09-16",
    total: 60,
  },
  {
    id: "INS-003",
    vehicle: "Toyota Corolla 2020",
    plate: "DEF-9012",
    inspector: "Alice Inspector",
    status: "IN_PROGRESS",
    date: "2024-09-16",
    total: 75,
  },
  {
    id: "INS-004",
    vehicle: "Nissan Altima 2023",
    plate: "GHI-3456",
    inspector: "Carol Smith",
    status: "COMPLETED",
    date: "2024-09-14",
    total: 80,
  },
  {
    id: "INS-005",
    vehicle: "Hyundai Elantra 2022",
    plate: "JKL-7890",
    inspector: "Bob Technician",
    status: "FAILED",
    date: "2024-09-13",
    total: 90,
  },
]

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const user = getStoredUser()

  useEffect(() => {
    dashboardApi.getStats().then(setStats).catch(() => {})
  }, [])

  const statsData = [
    { title: "Total Inspections", value: String(stats?.totalInspections ?? "—"), icon: Briefcase, trend: "", trendUp: true },
    { title: "Pending Inspections", value: String(stats?.pendingInspections ?? "—"), icon: Clock, trend: "", trendUp: false },
    { title: "Registered Vehicles", value: String(stats?.totalVehicles ?? "—"), icon: Car, trend: "", trendUp: true },
    { title: "Vehicle Owners", value: String(stats?.totalOwners ?? "—"), icon: Users, trend: "", trendUp: true },
    { title: "Completed", value: String(stats?.completedInspections ?? "—"), icon: CheckCircle, trend: "", trendUp: true },
  ]

  const filteredInspections = initialInspections.filter((ins) => {
    const matchesSearch =
      ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.inspector.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter ? ins.status === statusFilter : true

    return matchesSearch && matchesStatus
  })

  const cycleStatusFilter = () => {
    if (statusFilter === null) setStatusFilter("COMPLETED")
    else if (statusFilter === "COMPLETED") setStatusFilter("PENDING")
    else if (statusFilter === "PENDING") setStatusFilter("IN_PROGRESS")
    else if (statusFilter === "IN_PROGRESS") setStatusFilter("FAILED")
    else setStatusFilter(null)
  }

  return (
    <div className={cn(dashboardPageClass, "space-y-6")} style={dashboardPageStyle}>
      {/* Header Section */}
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Admin Dashboard</h1>
        <p className={pageHeaderSubtitleClass}>
          {user?.companyName
            ? `${user.companyName} — Company Dashboard`
            : "Hirshabelle State of Somalia — Ministry of Youth and Sports"}
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsData.map((stat, i) => (
          <div
            key={i}
            className="trezo-card p-5 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className={dashboardStatIconClass(i)}>
                <stat.icon className="size-5" />
              </div>
              {stat.trendUp !== null && (
                <div
                  className={cn(
                    "flex items-center text-[10px] font-black uppercase tracking-widest",
                    stat.trendUp ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {stat.trendUp ? (
                    <ArrowUpRight className="size-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="size-3 mr-0.5" />
                  )}
                  {stat.trend}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {stat.title}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-foreground mt-1">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Area Chart */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Revenue Analytics
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Weekly earnings report
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-4">
                <div className="size-2 rounded-full" style={{ backgroundColor: bluePalette.primaryBlue }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Revenue
                </span>
              </div>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenueBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={bluePalette.primaryBlue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={bluePalette.primaryBlue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={chartAxisTick}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={chartAxisTick}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={bluePalette.primaryBlue}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenueBlue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Volume Bar Chart */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Inspections Volume
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Inspections by weekday
              </p>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={chartAxisTick}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(21, 101, 192, 0.05)" }}
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Bar dataKey="inspections" radius={[4, 4, 0, 0]}>
                  {weeklyAnalytics.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={blueVariants[index % blueVariants.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Inspections Trend (Line Chart) [NEW] */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Inspection Performance Trend
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Passed vs Failed metrics
              </p>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={chartAxisTick} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#ffffff" }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
                />
                <Line
                  type="monotone"
                  dataKey="passed"
                  name="Passed"
                  stroke={bluePalette.primaryBlue}
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke={bluePalette.lightBlue}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Categories Pie Chart */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Inspections by Category
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Distribution of vehicles
              </p>
            </div>
          </div>

          <div className="h-[260px] w-full relative flex flex-col justify-between">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {vehicleCategoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={blueVariants[index % blueVariants.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a2744",
                      borderColor: "#0a2744",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {vehicleCategoryData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-1.5">
                  <div
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        blueVariants[index % blueVariants.length],
                    }}
                  />
                  <span className="text-[10px] font-black text-muted-foreground uppercase">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table (Full Width Below Charts) */}
      <div className="trezo-card overflow-hidden w-full">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between border-b border-border">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">
              Recent Inspections
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
              Last 5 active inspections
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48 group">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-muted/30 border border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-xs font-medium text-foreground"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleStatusFilter}
              className={cn(
                "h-9 px-3 bg-muted/30 border border-border text-muted-foreground hover:text-primary hover:border-primary/30",
                statusFilter && "border-primary/50 text-primary bg-primary/5"
              )}
            >
              <Filter className="size-3.5 mr-1.5" />
              <span className="text-xs font-semibold">
                {statusFilter ? statusFilter : "Filter"}
              </span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Vehicle</TableHead>
                <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Plate</TableHead>
                <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Inspector</TableHead>
                <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Status</TableHead>
                <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {filteredInspections.length > 0 ? (
                filteredInspections.map((row) => (
                  <TableRow key={row.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className={dashboardTableIdClass}>{row.id}</span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-[13px] font-semibold text-foreground">
                        {row.vehicle}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-xs text-muted-foreground font-mono font-bold">
                        {row.plate}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="text-[13px] text-foreground font-medium">
                        {row.inspector}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span
                        className={cn(
                          dashboardStatusBadgeClass,
                          getOrderStatusBadgeClass(row.status)
                        )}
                      >
                        {formatStatusLabel(row.status)}
                      </span>
                    </TableCell>
                    <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                      <span className="text-[13px] font-bold text-foreground">
                        ${row.total.toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    No inspections found matching criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border bg-card text-center">
          <Link
            href="/dashboard/inspections"
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary hover:underline transition-all"
          >
            View All Inspections
          </Link>
        </div>
      </div>
    </div>
  )
}
