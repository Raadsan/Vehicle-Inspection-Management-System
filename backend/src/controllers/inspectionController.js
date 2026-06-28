import { prisma } from "../lib/prisma.js";
import { resolveCompanyId, companyWhere } from "../lib/tenant.js";

export const createInspection = async (req, res) => {
  try {
    const { companyId, vehicleId, inspectorId, scheduledAt, startedAt, completedAt, status, notes, overallResult } = req.body;
    const targetCompanyId = resolveCompanyId(req, companyId);
    if (!vehicleId) {
      return res.status(400).json({ error: "vehicleId is required" });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (vehicle.companyId !== targetCompanyId && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Vehicle does not belong to your company" });
    }

    const inspection = await prisma.inspection.create({
      data: {
        companyId: targetCompanyId,
        vehicleId: Number(vehicleId),
        inspectorId: inspectorId ? Number(inspectorId) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        status: status || "PENDING",
        notes,
        overallResult,
      },
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(inspection);
  } catch (error) {
    console.error("Create Inspection error:", error);
    res.status(500).json({ error: error.message || "Failed to create inspection" });
  }
};

export const getInspections = async (req, res) => {
  try {
    const { status } = req.query;
    const scope = companyWhere(req, req.query.companyId);

    const inspections = await prisma.inspection.findMany({
      where: {
        ...scope,
        ...(status && { status }),
      },
      include: {
        company: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plateNumber: true, color: true, year: true, model: { include: { brand: true } } } },
        inspector: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(inspections);
  } catch (error) {
    console.error("Get Inspections error:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
};

export const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await prisma.inspection.findUnique({
      where: { id: Number(id) },
      include: {
        company: true,
        vehicle: { include: { model: { include: { brand: true } } } },
        inspector: true,
        inspectionItems: { include: { inspectionResults: true } },
      },
    });
    if (!inspection) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && inspection.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(inspection);
  } catch (error) {
    console.error("Get Inspection by ID error:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
};

export const updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && existing.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { vehicleId, inspectorId, scheduledAt, startedAt, completedAt, status, notes, overallResult } = req.body;

    const data = {};
    if (vehicleId !== undefined) data.vehicleId = Number(vehicleId);
    if (inspectorId !== undefined) data.inspectorId = inspectorId ? Number(inspectorId) : null;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (startedAt !== undefined) data.startedAt = startedAt ? new Date(startedAt) : null;
    if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (overallResult !== undefined) data.overallResult = overallResult;

    const inspection = await prisma.inspection.update({
      where: { id: Number(id) },
      data,
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(inspection);
  } catch (error) {
    console.error("Update Inspection error:", error);
    res.status(500).json({ error: "Failed to update inspection" });
  }
};

export const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && existing.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.inspection.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error("Delete Inspection error:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
};

// POST /api/inspections/:id/approve
export const approveInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });
    if (existing.status !== "AWAITING_APPROVAL") {
      return res.status(400).json({ error: `Cannot approve an inspection with status '${existing.status}'. It must be in AWAITING_APPROVAL state.` });
    }

    const inspection = await prisma.inspection.update({
      where: { id: Number(id) },
      data: {
        status: "APPROVED",
        notes: notes || existing.notes,
      },
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(inspection);
  } catch (error) {
    console.error("Approve Inspection error:", error);
    res.status(500).json({ error: "Failed to approve inspection" });
  }
};

export const rejectInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });
    if (existing.status !== "AWAITING_APPROVAL") {
      return res.status(400).json({ error: `Cannot reject an inspection with status '${existing.status}'. It must be in AWAITING_APPROVAL state.` });
    }

    const inspection = await prisma.inspection.update({
      where: { id: Number(id) },
      data: {
        status: "REJECTED",
        notes: notes || existing.notes,
      },
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(inspection);
  } catch (error) {
    console.error("Reject Inspection error:", error);
    res.status(500).json({ error: "Failed to reject inspection" });
  }
};
