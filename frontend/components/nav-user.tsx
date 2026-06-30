"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronDown, User as UserIcon, Settings2, LogOut } from "lucide-react"

import { formatUserRoleLabel, type StoredUser } from "@/lib/auth"

export function NavUser() {
  const { isMobile } = useSidebar()
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("user")
        setUser(stored ? JSON.parse(stored) : null)
      } catch {
        setUser(null)
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  if (!user) return null

  const initials = user.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.username.slice(0, 2).toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userPagePermissions")
    window.location.assign("/login")
  }

  const avatar = (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shadow-sm shrink-0 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.fullName || user.username} width={32} height={32} className="w-full h-full object-cover" unoptimized />
      ) : (
        initials
      )}
    </div>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-[#1565c0]/10 data-[state=open]:text-[#1565c0] border border-zinc-200/80 dark:border-border rounded-lg hover:bg-[#1565c0]/5 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center h-12"
            >
              {avatar}
              <div className="grid flex-1 text-left text-[11px] leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-foreground text-[12px]">
                  {user.fullName || user.username}
                </span>
                <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {formatUserRoleLabel(user)}
                </span>
              </div>
              <ChevronDown className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-72 rounded-xl shadow-2xl border-border/50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-3 py-2.5 text-left text-sm">
                {avatar}
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-bold text-[12px]">
                    {user.fullName || user.username}
                  </span>
                  <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {formatUserRoleLabel(user)}
                  </span>
                  {user.email && (
                    <span className="truncate text-[10px] font-normal text-muted-foreground/80">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                  <UserIcon className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/change-password" className="text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                  <Settings2 className="mr-2 size-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs font-semibold uppercase tracking-widest text-destructive dark:text-white cursor-pointer hover:bg-destructive/5"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4 dark:text-white" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
