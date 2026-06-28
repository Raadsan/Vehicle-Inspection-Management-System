"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  CarIcon,
  ClipboardListIcon,
  UsersIcon,
  UserCircleIcon,
  FileTextIcon,
  CreditCardIcon,
  WrenchIcon,
  Building2,
  Settings2Icon,
  TagIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { NavUser } from "@/components/nav-user"

// ─── Navigation Config ────────────────────────────────────────────────────────
// roles: undefined = visible to all, or array of roles that CAN see it
type NavItem = {
  title: string
  url: string
  icon: React.ElementType
  roles?: string[]
  children?: { title: string; url: string }[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },

  // ── Admin-only sections ──
  
  {
    title: "Users",
    url: "/dashboard/users",
    icon: UsersIcon,
    roles: ["SUPER_ADMIN"],
  },

  {
    title: "Companies",
    url: "/dashboard/companies",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
  },

  

  // ── Shared sections ──
  {
    title: "Vehicle Owners",
    url: "/dashboard/owners",
    icon: UserCircleIcon,
    roles: ["SUPER_ADMIN", "STAFF"],
  },
  {
    title: "Vehicles Management",
    url: "/dashboard/vehicles",
    icon: CarIcon,
    children: [
      { title: "Vehicles", url: "/dashboard/vehicles" },
      { title: "Brands", url: "/dashboard/brands" },
      { title: "Models", url: "/dashboard/models" },
    ],
  },
  {
    title: "Inspectors",
    url: "/dashboard/inspectors",
    icon: WrenchIcon,
    roles: ["SUPER_ADMIN", "STAFF"],
  },
  {
    title: "Inspections",
    url: "/dashboard/inspections",
    icon: ClipboardListIcon,
    children: [
      { title: "All Inspections", url: "/dashboard/inspections" },
      { title: "Schedule Inspection", url: "/dashboard/inspections/create" },
      { title: "Inspection Items", url: "/dashboard/inspections/items" },
    ],
  },
  // Approval queue — admin only
  {
    title: "Awaiting Approval",
    url: "/dashboard/inspections/approval",
    icon: CheckCircleIcon,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Payments",
    url: "/dashboard/payments",
    icon: CreditCardIcon,
    roles: ["SUPER_ADMIN", "STAFF"],
    children: [
      { title: "Customer Payments", url: "/dashboard/payments/customers" },
      { title: "Inspector Payments", url: "/dashboard/payments/inspectors" },
      { title: "Invoices", url: "/dashboard/payments/invoices" },
      { title: "Transactions", url: "/dashboard/payments/transactions" },
    ],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileTextIcon,
    roles: ["SUPER_ADMIN", "STAFF"],
  },

  {
    title: "Configuration",
    url: "/dashboard/configuration",
    icon: Settings2Icon,
    roles: ["SUPER_ADMIN"],
    children: [
      { title: "Roles", url: "/dashboard/configuration/roles" },
      { title: "Role Permissions", url: "/dashboard/configuration/role-permissions" },
      { title: "Audit Log", url: "/dashboard/configuration/audit-log" },
    ],
  },
]

// ─── Sidebar Component ────────────────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Read user role from localStorage
  const [userRole, setUserRole] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user")
        if (stored) {
          const parsed = JSON.parse(stored)
          setUserRole(parsed?.role || null)
        }
      } catch {
        setUserRole(null)
      }
    }
  }, [])

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(url)
  }

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true // visible to all
    if (!userRole) return true  // not loaded yet, show all
    return item.roles.includes(userRole)
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ─── Header / Logo ─────────────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border pb-4 pt-5 px-4 flex items-center justify-center">
        <Link href="/dashboard" className="flex items-center justify-center w-full">
          <Image
            src="/login_bg.png"
            alt="Logo"
            width={170}
            height={50}
            className="object-contain shrink-0"
            priority
          />
        </Link>
      </SidebarHeader>

      {/* ─── Navigation ──────────────────────────────────────────── */}
      <SidebarContent className="py-4 overflow-y-auto px-2">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {visibleItems.map((item) =>
              item.children ? (
                // ── Collapsible Item ──
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive(item.url)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        data-active={isActive(item.url)}
                        className="font-normal text-[14.5px] text-zinc-700 hover:text-primary transition-colors py-2.5 px-3 h-11.5 rounded-lg"
                      >
                        <item.icon className="shrink-0 size-5 text-zinc-500 group-data-[active=true]:text-primary" />
                        <span className="flex-1 ml-1">{item.title}</span>
                        <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-400" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-5 mt-1 border-l border-zinc-100 pl-2 gap-1">
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton
                              asChild
                              data-active={pathname === child.url}
                              className="font-normal text-[13.5px] text-zinc-500 hover:text-primary transition-colors py-2 px-3 h-9 rounded-md"
                            >
                              <Link href={child.url}>
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                // ── Simple Item ──
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    data-active={isActive(item.url)}
                    className="font-normal text-[14.5px] text-zinc-700 hover:text-primary transition-colors py-2.5 px-3 h-11.5 rounded-lg"
                  >
                    <Link href={item.url}>
                      <item.icon className="shrink-0 size-5 text-zinc-500 group-data-[active=true]:text-primary" />
                      <span className="ml-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ─── Footer / User Menu ─────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
