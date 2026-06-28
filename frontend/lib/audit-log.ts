import { auditLogApi } from "@/lib/api"

interface LogAuditParams {
  action: string
  entity?: string
  entityId?: number
  details?: string
}

function getStoredUser(): { id?: number; companyId?: number; username?: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Fire-and-forget audit log entry */
export async function logAudit({ action, entity, entityId, details }: LogAuditParams) {
  const user = getStoredUser()
  try {
    await auditLogApi.create({
      action,
      entity,
      entityId,
      details,
      userId: user?.id,
      companyId: user?.companyId,
    })
  } catch {
    // Don't block UI if audit logging fails
  }
}
