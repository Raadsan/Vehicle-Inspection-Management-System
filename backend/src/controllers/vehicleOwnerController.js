// src/controllers/vehicleOwnerController.js
import { prisma } from "../lib/prisma.js";
import { ensureCustomerPaymentForVehicle } from "../lib/customerPayment.js";

// Create VehicleOwner relation
export const createVehicleOwner = async (req, res) => {
  try {
    const { vehicleId, ownerId, isPrimary, fromDate, toDate } = req.body;
    if (!vehicleId || !ownerId) {
      return res.status(400).json({ error: "vehicleId and ownerId are required" });
    }
    const vehicleOwner = await prisma.vehicleOwner.create({
      data: {
        vehicleId: Number(vehicleId),
        ownerId: Number(ownerId),
        isPrimary: isPrimary ?? false,
        fromDate: fromDate ? new Date(fromDate) : new Date(),
        toDate: toDate ? new Date(toDate) : null,
      },
    });
    if (vehicleOwner.isPrimary) {
      await ensureCustomerPaymentForVehicle(vehicleOwner.vehicleId);
    }
    res.status(201).json(vehicleOwner);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Relation between this vehicle and owner already exists" });
    }
    console.error("Create VehicleOwner error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all VehicleOwners
export const getAllVehicleOwners = async (req, res) => {
  try {
    const list = await prisma.vehicleOwner.findMany({
      include: {
        vehicle: true,
        owner: true,
      },
    });
    res.json(list);
  } catch (err) {
    console.error("Get VehicleOwners error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get VehicleOwner by ID
export const getVehicleOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicleOwner = await prisma.vehicleOwner.findUnique({
      where: { id: Number(id) },
      include: {
        vehicle: true,
        owner: true,
      },
    });
    if (!vehicleOwner) return res.status(404).json({ error: "VehicleOwner relation not found" });
    res.json(vehicleOwner);
  } catch (err) {
    console.error("Get VehicleOwner error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update VehicleOwner
export const updateVehicleOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId, ownerId, isPrimary, fromDate, toDate } = req.body;
    const updated = await prisma.vehicleOwner.update({
      where: { id: Number(id) },
      data: {
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        ownerId: ownerId ? Number(ownerId) : undefined,
        isPrimary,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : toDate === null ? null : undefined,
      },
    });
    if (updated.isPrimary) {
      await ensureCustomerPaymentForVehicle(updated.vehicleId);
    }
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "VehicleOwner relation not found" });
    console.error("Update VehicleOwner error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete VehicleOwner
export const deleteVehicleOwner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vehicleOwner.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "VehicleOwner relation not found" });
    console.error("Delete VehicleOwner error:", err);
    res.status(500).json({ error: err.message });
  }
};
