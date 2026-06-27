import { prisma } from "../lib/prisma.js";

// Create a new inspection
export const createInspection = async (req, res) => {
  try {
    const { companyId, vehicleId, inspectorId, scheduledAt, startedAt, completedAt, status, notes, overallResult } = req.body;
    if (!companyId || !vehicleId || !inspectorId) {
      return res.status(400).json({ error: "companyId, vehicleId, and inspectorId are required" });
    }
    const inspection = await prisma.inspection.create({
      data: {
        companyId: Number(companyId),
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
      }
    });
    res.status(201).json(inspection);
  } catch (error) {
    console.error("Create Inspection error:", error);
    res.status(500).json({ error: error.message || "Failed to create inspection" });
  }
};

// Get all inspections (optional filter by company)
export const getInspections = async (req, res) => {
  try {
    const { companyId } = req.query;
    const inspections = await prisma.inspection.findMany({
      where: companyId ? { companyId: Number(companyId) } : undefined,
      include: {
        company: true,
        vehicle: true,
        inspector: true,
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
        vehicle: true,
        inspector: true,
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
      }
    });
    res.json(inspection);
  } catch (error) {
    console.error("Update Inspection error:", error);
    res.status(500).json({ error: "Failed to update inspection" });
  }
};

// Delete inspection
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
