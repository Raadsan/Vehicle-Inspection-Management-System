import { prisma } from "./prisma.js";

export async function writeAuditLog({
  companyId,
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: companyId ? Number(companyId) : undefined,
        userId: userId ? Number(userId) : undefined,
        action,
        entity,
        entityId: entityId ? Number(entityId) : undefined,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
}
