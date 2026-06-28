import { prisma } from "../lib/prisma.js";
import { resolveCompanyId, companyWhere } from "../lib/tenant.js";

const vehicleInclude = {
  model: { include: { brand: true } },
  vehicleColor: true,
  company: { select: { id: true, name: true } },
  registrationFee: true,
  vehicleOwners: {
    where: { isPrimary: true },
    include: { owner: { select: { id: true, fullName: true, phone: true, email: true } } },
    take: 1,
  },
};

function formatVehicle(vehicle) {
  const primaryOwner = vehicle.vehicleOwners?.[0];
  return {
    ...vehicle,
    ownerId: primaryOwner?.ownerId,
    owner: primaryOwner?.owner,
  };
}

async function resolveColorName(color, colorId) {
  if (colorId) {
    const found = await prisma.vehicleColor.findUnique({ where: { id: Number(colorId) } });
    if (found) return { colorName: found.name, colorId: found.id };
  }
  return { colorName: color || null, colorId: colorId ? Number(colorId) : null };
}

async function syncPrimaryOwner(vehicleId, ownerId) {
  if (!ownerId) return;
  const existing = await prisma.vehicleOwner.findFirst({
    where: { vehicleId, isPrimary: true },
  });
  if (existing) {
    await prisma.vehicleOwner.update({
      where: { id: existing.id },
      data: { ownerId: Number(ownerId) },
    });
  } else {
    await prisma.vehicleOwner.create({
      data: { vehicleId, ownerId: Number(ownerId), isPrimary: true },
    });
  }
}

// POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const {
      companyId, modelId, plateNumber, color, colorId, year, vin, mileage,
      status, logbookNumber, ownerId, registrationFeeId,
    } = req.body;
    const targetCompanyId = resolveCompanyId(req, companyId);
    if (!modelId || !plateNumber) {
      return res.status(400).json({ error: "modelId and plateNumber are required" });
    }

    const { colorName, colorId: resolvedColorId } = await resolveColorName(color, colorId);

    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: Number(targetCompanyId),
        modelId: Number(modelId),
        plateNumber,
        color: colorName,
        colorId: resolvedColorId,
        year: year ? Number(year) : null,
        vin: vin || null,
        mileage: mileage ? Number(mileage) : null,
        status,
        logbookNumber: logbookNumber || null,
        registrationFeeId: registrationFeeId ? Number(registrationFeeId) : null,
      },
      include: vehicleInclude,
    });

    if (ownerId) await syncPrimaryOwner(vehicle.id, ownerId);

    const result = await prisma.vehicle.findUnique({
      where: { id: vehicle.id },
      include: vehicleInclude,
    });
    res.status(201).json(formatVehicle(result));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Plate number or VIN already exists" });
    if (err.code === "P2003") return res.status(404).json({ error: "Company, Model, or Color not found" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const { status } = req.query;
    const scope = companyWhere(req, req.query.companyId);
    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...scope,
        ...(status && { status }),
      },
      include: {
        ...vehicleInclude,
        _count: { select: { inspections: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles.map(formatVehicle));
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
        vehicleColor: true,
        company: { select: { id: true, name: true } },
        vehicleOwners: { include: { owner: true } },
        vehicleInspectors: { include: { inspector: true } },
        inspections: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(formatVehicle(vehicle));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const {
      plateNumber, color, colorId, year, vin, mileage, status,
      modelId, logbookNumber, ownerId, registrationFeeId,
    } = req.body;

    const { colorName, colorId: resolvedColorId } = await resolveColorName(color, colorId);

    const data = {
      plateNumber,
      vin: vin !== undefined ? (vin || null) : undefined,
      status,
      logbookNumber: logbookNumber !== undefined ? (logbookNumber || null) : undefined,
      year: year !== undefined ? (year ? Number(year) : null) : undefined,
      mileage: mileage !== undefined ? (mileage ? Number(mileage) : null) : undefined,
      modelId: modelId ? Number(modelId) : undefined,
      registrationFeeId: registrationFeeId !== undefined
        ? (registrationFeeId ? Number(registrationFeeId) : null)
        : undefined,
    };

    if (colorId !== undefined || color !== undefined) {
      data.color = colorName;
      data.colorId = resolvedColorId;
    }

    await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data,
    });

    if (ownerId) await syncPrimaryOwner(Number(req.params.id), ownerId);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(req.params.id) },
      include: vehicleInclude,
    });
    res.json(formatVehicle(vehicle));
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
