import { prisma } from "../lib/prisma.js";

// POST /api/vehicle-models
export const createVehicleModel = async (req, res) => {
  try {
    const { brandId, name, year } = req.body;
    if (!brandId || !name) return res.status(400).json({ error: "brandId and name are required" });
    const model = await prisma.vehicleModel.create({
      data: { brandId: Number(brandId), name, year: year ? Number(year) : null },
      include: { brand: true },
    });
    res.status(201).json(model);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Model already exists for this brand" });
    if (err.code === "P2003") return res.status(404).json({ error: "Brand not found" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicle-models
export const getAllVehicleModels = async (req, res) => {
  try {
    const { brandId } = req.query;
    const models = await prisma.vehicleModel.findMany({
      where: brandId ? { brandId: Number(brandId) } : undefined,
      include: { brand: true, _count: { select: { vehicles: true } } },
      orderBy: { name: "asc" },
    });
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicle-models/:id
export const getVehicleModelById = async (req, res) => {
  try {
    const model = await prisma.vehicleModel.findUnique({
      where: { id: Number(req.params.id) },
      include: { brand: true, vehicles: true },
    });
    if (!model) return res.status(404).json({ error: "Model not found" });
    res.json(model);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/vehicle-models/:id
export const updateVehicleModel = async (req, res) => {
  try {
    const { name, year, brandId } = req.body;
    const model = await prisma.vehicleModel.update({
      where: { id: Number(req.params.id) },
      data: { name, year: year ? Number(year) : undefined, brandId: brandId ? Number(brandId) : undefined },
      include: { brand: true },
    });
    res.json(model);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Model not found" });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vehicle-models/:id
export const deleteVehicleModel = async (req, res) => {
  try {
    await prisma.vehicleModel.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Model deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Model not found" });
    res.status(500).json({ error: err.message });
  }
};
