import { prisma } from "../lib/prisma.js";

export const createAuditLog = async (req, res) => {
  try {
    const { companyId, userId, action, entity, entityId, details, ipAddress } = req.body;
    if (!action) return res.status(400).json({ error: "action is required" });

    const log = await prisma.auditLog.create({
      data: {
        companyId: companyId ? Number(companyId) : req.user?.companyId ? Number(req.user.companyId) : undefined,
        userId: userId ? Number(userId) : req.user?.id ? Number(req.user.id) : undefined,
        action,
        entity,
        entityId: entityId ? Number(entityId) : undefined,
        details,
        ipAddress: ipAddress || req.ip,
      },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        company: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error("Create audit log error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllAuditLogs = async (req, res) => {
  try {
    const { companyId, userId, entity, limit = 100 } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(companyId ? { companyId: Number(companyId) } : {}),
        ...(userId ? { userId: Number(userId) } : {}),
        ...(entity ? { entity } : {}),
      },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 100, 500),
    });
    res.json(logs);
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        company: { select: { id: true, name: true } },
      },
    });
    if (!log) return res.status(404).json({ error: "Audit log not found" });
    res.json(log);
  } catch (err) {
    console.error("Get audit log error:", err);
    res.status(500).json({ error: err.message });
  }
};
