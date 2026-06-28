import { prisma } from "../lib/prisma.js";

// Create a new inspection
export const createInspection = async (req, res) => {
  try {
    const { companyId, vehicleId, inspectorId, scheduledAt, startedAt, completedAt, status, notes, overallResult } = req.body;
    const targetCompanyId = companyId || req.user?.companyId || 1;
    if (!vehicleId || !inspectorId) {
      return res.status(400).json({ error: "vehicleId and inspectorId are required" });
    }
    const inspection = await prisma.inspection.create({
      data: {
        companyId: Number(targetCompanyId),
        vehicleId: Number(vehicleId),
        inspectorId: Number(inspectorId),
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
      }
    });
    res.status(201).json(inspection);
  } catch (error) {
    console.error("Create Inspection error:", error);
    res.status(500).json({ error: error.message || "Failed to create inspection" });
  }
};

// Get all inspections — OWNER role can only see their own company's inspections
export const getInspections = async (req, res) => {
  try {
    const { companyId, status } = req.query;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    // Build the where filter
    let where = {};

    // OWNER role: always filter to their company only
    if (userRole === "OWNER") {
      where.companyId = userCompanyId;
    } else if (companyId) {
      where.companyId = Number(companyId);
    }

    if (status) {
      where.status = status;
    }

    const inspections = await prisma.inspection.findMany({
      where,
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

// Get inspection by ID
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
    res.json(inspection);
  } catch (error) {
    console.error("Get Inspection by ID error:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
};

// Update inspection
export const updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId, inspectorId, scheduledAt, startedAt, completedAt, status, notes, overallResult } = req.body;
    
    const data = {};
    if (vehicleId !== undefined) data.vehicleId = Number(vehicleId);
    if (inspectorId !== undefined) data.inspectorId = Number(inspectorId);
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
      }
    });
    res.json(inspection);
  } catch (error) {
    console.error("Update Inspection error:", error);
    res.status(500).json({ error: "Failed to update inspection" });
  }
};

// DELETE inspection
export const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inspection.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error("Delete Inspection error:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
};

// POST /api/inspections/:id/approve — Admin approves an inspection
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

// POST /api/inspections/:id/reject — Admin rejects an inspection
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
