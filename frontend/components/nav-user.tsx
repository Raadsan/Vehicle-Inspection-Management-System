"use client"

import { useEffect, useState } from "react"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
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
import { MoreVertical, User as UserIcon, Settings2, LogOut } from "lucide-react"

interface StoredUser {
  username: string
  fullName?: string
  role?: string
  email?: string
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) setUser(JSON.parse(stored))
    } catch {
      // ignore
    }
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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-sidebar-border/40 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary text-white font-medium text-[15px] shadow-sm shadow-primary/20">
                {initials}
              </div>
              <div className="grid flex-1 text-left text-[11px] leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-sidebar-foreground uppercase tracking-tight">
                  {user.fullName || user.username}
                </span>
                <span className="truncate text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
                  {user.role}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
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
                <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white font-medium text-[15px] shadow-sm shadow-primary/20">
                  {initials}
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-medium uppercase tracking-tight">
                    {user.fullName || user.username}
                  </span>
                  <span className="truncate text-[11px] font-normal uppercase tracking-widest text-muted-foreground">
                    {user.role}
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
              <DropdownMenuItem className="text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                <UserIcon className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                <Settings2 className="mr-2 size-4" />
                Settings
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
