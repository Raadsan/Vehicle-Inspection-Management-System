import { prisma } from "../lib/prisma.js";

// POST /api/vehicle-brands
export const createVehicleBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Brand name is required" });
    const brand = await prisma.vehicleBrand.create({
      data: { name, description },
      include: { models: true },
    });
    res.status(201).json(brand);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Brand already exists" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicle-brands
export const getAllVehicleBrands = async (req, res) => {
  try {
    const brands = await prisma.vehicleBrand.findMany({
      include: { models: true, _count: { select: { models: true } } },
      orderBy: { name: "asc" },
    });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vehicle-brands/:id
export const getVehicleBrandById = async (req, res) => {
  try {
    const brand = await prisma.vehicleBrand.findUnique({
      where: { id: Number(req.params.id) },
      include: { models: true },
    });
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/vehicle-brands/:id
export const updateVehicleBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    const brand = await prisma.vehicleBrand.update({
      where: { id: Number(req.params.id) },
      data: { name, description },
    });
    res.json(brand);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Brand not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Brand name already exists" });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vehicle-brands/:id
export const deleteVehicleBrand = async (req, res) => {
  try {
    await prisma.vehicleBrand.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Brand deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Brand not found" });
    res.status(500).json({ error: err.message });
  }
};
