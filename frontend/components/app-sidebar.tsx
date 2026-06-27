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
  BarChart3Icon,
  FileTextIcon,
  CreditCardIcon,
  WrenchIcon,
  BuildingIcon,
  Settings2Icon,
  CircleHelpIcon,
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

// ─── Flat Navigation Config (No Groups / Labels) ─────────────────────────────
const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },

  {
    title: "Users",
    url: "/dashboard/users",
    icon: UsersIcon,
  },

  {
    title: "Configuration",
    url: "/dashboard/configuration",
    icon: Settings2Icon,
    children: [
      { title: "Roles", url: "/dashboard/configuration/roles" },
      { title: "Role Permissions", url: "/dashboard/configuration/role-permissions" },
      { title: "Audit Log", url: "/dashboard/configuration/audit-log" },
    ],
  },

  {
    title: "Company",
    url: "/dashboard/company",
    icon: BuildingIcon,
  },

  {
    title: "Vehicle Owners",
    url: "/dashboard/owners",
    icon: UserCircleIcon,
  },
  
  {
    title: "Inspections",
    url: "/dashboard/inspections",
    icon: ClipboardListIcon,
    children: [
      { title: "All Inspections", url: "/dashboard/inspections" },
      { title: "Schedule Inspection", url: "/dashboard/inspections/create" },
      { title: "Inspection Items", url: "/dashboard/inspections/items" },
      { title: "Results", url: "/dashboard/inspections/results" },
    ],
  },
  {
    title: "Vehicles",
    url: "/dashboard/vehicles",
    icon: CarIcon,
    children: [
      { title: "All Vehicles", url: "/dashboard/vehicles" },
      { title: "Add Vehicle", url: "/dashboard/vehicles/create" },
      { title: "Brands & Models", url: "/dashboard/vehicles/brands" },
    ],
  },
  {
    title: "Inspectors",
    url: "/dashboard/inspectors",
    icon: WrenchIcon,
  },
  
  {
    title: "Payments",
    url: "/dashboard/payments",
    icon: CreditCardIcon,
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
  },
  // {
  //   title: "Analytics",
  //   url: "/dashboard/analytics",
  //   icon: BarChart3Icon,
  // },
  
  
  
]

const bottomItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings2Icon },
  { title: "Help", url: "/dashboard/help", icon: CircleHelpIcon },
]

// ─── Sidebar Component ────────────────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ─── Header / Logo (Only centered login_bg.png, no text) ─────── */}
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

      {/* ─── Navigation (Slightly larger sizing) ────────────────────── */}
      <SidebarContent className="py-4 overflow-y-auto px-2">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {navItems.map((item) =>
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

        {/* ── Bottom utility items ── */}
        {/* <SidebarGroup className="mt-auto">
          <SidebarMenu className="gap-1">
            {bottomItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className="font-normal text-[13.5px] text-zinc-500 hover:text-primary transition-colors py-2 px-3 h-10.5 rounded-md"
                >
                  <Link href={item.url}>
                    <item.icon className="shrink-0 size-4.5 text-zinc-400" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup> */}
      </SidebarContent>

      {/* ─── Footer / User Menu ─────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
