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
  Building2,
  Settings2Icon,
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
import { getStoredUser, canViewPage, type StoredUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

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
      { title: "Colors", url: "/dashboard/colors" },
      { title: "Registration Fees", url: "/dashboard/registration-fees" },
    ],
  },
  {
    title: "Vehicle Inspect",
    url: "/dashboard/inspections",
    icon: ClipboardListIcon,
    children: [
      { title: "Vehicle Inspections", url: "/dashboard/inspections" },
      { title: "Inspection Check", url: "/dashboard/inspections/check" },
      { title: "Inspection Items", url: "/dashboard/inspections/items" },
    ],
  },
  {
    title: "Inspection Approvals",
    url: "/dashboard/inspections/approval",
    icon: ClipboardListIcon,
    children: [
      { title: "Awaiting Approval", url: "/dashboard/inspections/approval" },
      { title: "Approved", url: "/dashboard/inspections/approved" },
      { title: "Expired", url: "/dashboard/inspections/expired" },
      { title: "Rejected", url: "/dashboard/inspections/rejected" },
    ],
  },
  {
    title: "Payments",
    url: "/dashboard/payments",
    icon: CreditCardIcon,
    roles: ["SUPER_ADMIN", "STAFF"],
    children: [
      { title: "Customer Payments", url: "/dashboard/payments/customers" },
      { title: "Invoices", url: "/dashboard/payments/invoices" },
    ],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileTextIcon,
    roles: ["SUPER_ADMIN", "STAFF"],
    children: [
      { title: "Vehicle Report", url: "/dashboard/reports/vehicles" },
      { title: "Payment Report", url: "/dashboard/reports/payments" },
      { title: "Vehicle Inspection Report", url: "/dashboard/reports/inspections" },
    ],
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

const activeMenuClass =
  "bg-[#1565c0]/10 text-[#1565c0] font-semibold hover:bg-[#1565c0]/15 hover:text-[#1565c0] data-[active=true]:bg-[#1565c0]/10 data-[active=true]:text-[#1565c0]"
const activeSubMenuClass =
  "bg-[#1565c0]/10 text-[#1565c0] font-semibold hover:bg-[#1565c0]/15 hover:text-[#1565c0] data-[active=true]:bg-[#1565c0]/10 data-[active=true]:text-[#1565c0]"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<StoredUser | null>(null)
  const [openSection, setOpenSection] = React.useState<string | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setUser(getStoredUser()), 0)
    return () => clearTimeout(timer)
  }, [])

  const isChildActive = React.useCallback((url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard"
    if (url === "/dashboard/inspections") {
      return pathname === "/dashboard/inspections" || pathname.startsWith("/dashboard/inspections/create")
    }
    if (url === "/dashboard/inspections/approval") {
      return pathname === "/dashboard/inspections/approval"
    }
    // All other nav child URLs are unique — exact match only
    return pathname === url
  }, [pathname])

  const sectionIsOpen = React.useCallback((item: NavItem) => {
    if (!item.children) return false
    return item.children.some((child) => isChildActive(child.url))
  }, [isChildActive])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const openParent = navItems.find((item) => item.children && sectionIsOpen(item))
      setOpenSection(openParent?.title ?? null)
    }, 0)
    return () => clearTimeout(timer)
  }, [pathname, sectionIsOpen])

  const itemVisible = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => canViewPage(child.url, user))
    }
    return canViewPage(item.url, user)
  }

  const visibleItems = navItems.filter(itemVisible)
  const visibleChildren = (item: NavItem) =>
    item.children?.filter((child) => canViewPage(child.url, user)) ?? []

  return (
    <Sidebar collapsible="icon" {...props}>
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

      <SidebarContent className="py-4 overflow-y-auto px-2">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {visibleItems.map((item) =>
              item.children ? (
                <Collapsible
                  key={item.title}
                  asChild
                  open={openSection === item.title}
                  onOpenChange={(open) => setOpenSection(open ? item.title : null)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="font-normal text-[14.5px] text-zinc-700 hover:text-[#1565c0] transition-colors py-2.5 px-3 h-11.5 rounded-lg"
                      >
                        <item.icon className="shrink-0 size-5 text-zinc-500" />
                        <span className="flex-1 ml-1">{item.title}</span>
                        <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-400" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-5 mt-1 border-l border-zinc-100 pl-2 gap-1">
                        {visibleChildren(item).map((child) => {
                          const childActive = isChildActive(child.url)
                          return (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={childActive}
                                className={cn(
                                  "font-normal text-[13.5px] text-zinc-500 hover:text-[#1565c0] transition-colors py-2 px-3 h-9 rounded-md",
                                  childActive && activeSubMenuClass
                                )}
                              >
                                <Link href={child.url}>
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isChildActive(item.url)}
                    className={cn(
                      "font-normal text-[14.5px] text-zinc-700 hover:text-[#1565c0] transition-colors py-2.5 px-3 h-11.5 rounded-lg",
                      isChildActive(item.url) && activeMenuClass
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon
                        className={cn(
                          "shrink-0 size-5 text-zinc-500",
                          isChildActive(item.url) && "text-[#1565c0]"
                        )}
                      />
                      <span className="ml-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
