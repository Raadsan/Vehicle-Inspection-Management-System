/** Shared sidebar / permission pages — keep in sync with app-sidebar.tsx */

export type PermissionAction = "view" | "add" | "edit" | "delete"

export const PERMISSION_ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: "add", label: "Add" },
  { key: "view", label: "View" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
]

export interface PermissionPage {
  key: string
  title: string
  url: string
  section: string
}

export interface PermissionSection {
  section: string
  pages: PermissionPage[]
}

const rawSections: { section: string; pages: { title: string; url: string }[] }[] = [
  {
    section: "Main",
    pages: [{ title: "Dashboard", url: "/dashboard" }],
  },
  {
    section: "Administration",
    pages: [
      { title: "Users", url: "/dashboard/users" },
      { title: "Companies", url: "/dashboard/companies" },
    ],
  },
  {
    section: "Vehicle Owners",
    pages: [{ title: "Vehicle Owners", url: "/dashboard/owners" }],
  },
  {
    section: "Vehicles Management",
    pages: [
      { title: "Vehicles", url: "/dashboard/vehicles" },
      { title: "Brands", url: "/dashboard/brands" },
      { title: "Models", url: "/dashboard/models" },
      { title: "Colors", url: "/dashboard/colors" },
      { title: "Registration Fees", url: "/dashboard/registration-fees" },
    ],
  },
  {
    section: "Inspectors",
    pages: [{ title: "Inspectors", url: "/dashboard/inspectors" }],
  },
  {
    section: "Inspections",
    pages: [
      { title: "All Inspections", url: "/dashboard/inspections" },
      { title: "Schedule Inspection", url: "/dashboard/inspections/create" },
      { title: "Inspection Items", url: "/dashboard/inspections/items" },
      { title: "Awaiting Approval", url: "/dashboard/inspections/approval" },
    ],
  },
  {
    section: "Payments",
    pages: [
      { title: "Customer Payments", url: "/dashboard/payments/customers" },
      { title: "Inspector Payments", url: "/dashboard/payments/inspectors" },
      { title: "Invoices", url: "/dashboard/payments/invoices" },
      { title: "Transactions", url: "/dashboard/payments/transactions" },
    ],
  },
  {
    section: "Reports",
    pages: [{ title: "Reports", url: "/dashboard/reports" }],
  },
  {
    section: "Configuration",
    pages: [
      { title: "Roles", url: "/dashboard/configuration/roles" },
      { title: "Role Permissions", url: "/dashboard/configuration/role-permissions" },
      { title: "Audit Log", url: "/dashboard/configuration/audit-log" },
    ],
  },
]

function urlToKey(url: string): string {
  return url
    .replace(/^\/dashboard\/?/, "")
    .replace(/\//g, ".")
    .replace(/^$/, "dashboard")
}

export function getPermissionSections(): PermissionSection[] {
  return rawSections.map(({ section, pages }) => ({
    section,
    pages: pages.map((p) => ({
      key: urlToKey(p.url),
      title: p.title,
      url: p.url,
      section,
    })),
  }))
}

export function getAllPermissionPages(): PermissionPage[] {
  return getPermissionSections().flatMap((s) => s.pages)
}

/** Display label like reference UI: Vehicle_owners, Inspection_items */
export function toModuleLabel(page: PermissionPage): string {
  const base = page.title.trim().replace(/\s+/g, "_")
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export type PagePermissions = Record<PermissionAction, boolean>

export type RolePermissionMap = Record<string, PagePermissions>

export function emptyPagePermissions(): PagePermissions {
  return { view: false, add: false, edit: false, delete: false }
}

export function createEmptyRolePermissions(): RolePermissionMap {
  const map: RolePermissionMap = {}
  for (const page of getAllPermissionPages()) {
    map[page.key] = emptyPagePermissions()
  }
  return map
}

export function countGrantedPermissions(perms: RolePermissionMap): number {
  return Object.values(perms).reduce(
    (sum, p) => sum + PERMISSION_ACTIONS.filter((a) => p[a.key]).length,
    0
  )
}
