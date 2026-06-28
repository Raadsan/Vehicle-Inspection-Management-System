import { prisma } from "../lib/prisma.js";

// POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const { companyId, modelId, plateNumber, color, year, vin, mileage, status, logbookNumber } = req.body;
    const targetCompanyId = companyId || req.user?.companyId || 1;
    if (!modelId || !plateNumber) {
      return res.status(400).json({ error: "modelId and plateNumber are required" });
    }
    const vehicle = await prisma.vehicle.create({
      data: { 
        companyId: Number(targetCompanyId), 
        modelId: Number(modelId), 
        plateNumber, 
        color, 
        year: year ? Number(year) : null, 
        vin, 
        mileage: mileage ? Number(mileage) : null, 
        status, 
        logbookNumber 
      },
      include: { model: { include: { brand: true } }, company: { select: { id: true, name: true } } },
    });
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Plate number or VIN already exists" });
    if (err.code === "P2003") return res.status(404).json({ error: "Company or Model not found" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const { companyId, status } = req.query;
    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(companyId && { companyId: Number(companyId) }),
        ...(status && { status }),
      },
      include: {
        model: { include: { brand: true } },
        company: { select: { id: true, name: true } },
        vehicleOwners: { include: { owner: { select: { id: true, fullName: true, phone: true } } } },
        _count: { select: { inspections: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicles/:id
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        model: { include: { brand: true } },
        company: { select: { id: true, name: true } },
        vehicleOwners: { include: { owner: true } },
        vehicleInspectors: { include: { inspector: true } },
        inspections: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const { plateNumber, color, year, vin, mileage, status, modelId, logbookNumber } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: {
        plateNumber, color, vin, status, logbookNumber,
        year: year ? Number(year) : undefined,
        mileage: mileage ? Number(mileage) : undefined,
        modelId: modelId ? Number(modelId) : undefined,
      },
      include: { model: { include: { brand: true } } },
    });
    res.json(vehicle);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Vehicle not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Plate number or VIN already exists" });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Vehicle not found" });
    res.status(500).json({ error: err.message });
  }
};
