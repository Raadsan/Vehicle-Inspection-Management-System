import {
  createEmptyRolePermissions,
  type RolePermissionMap,
} from "@/lib/navigation-config"

const STORAGE_KEY = "rolePagePermissions"

type Store = Record<string, RolePermissionMap>

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getRolePagePermissions(roleId: number): RolePermissionMap {
  const store = readStore()
  const saved = store[String(roleId)]
  const base = createEmptyRolePermissions()
  if (!saved) return base
  return { ...base, ...saved }
}

export function saveRolePagePermissions(roleId: number, perms: RolePermissionMap) {
  const store = readStore()
  store[String(roleId)] = perms
  writeStore(store)
}

export function getAllStoredRolePermissions(): Store {
  return readStore()
}
