import { prisma } from "../lib/prisma.js";

export const createVehicleColor = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Color name is required" });
    const color = await prisma.vehicleColor.create({
      data: { name: name.trim() },
    });
    res.status(201).json(color);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Color already exists" });
    res.status(500).json({ error: err.message });
  }
};

export const getAllVehicleColors = async (req, res) => {
  try {
    const colors = await prisma.vehicleColor.findMany({
      include: { _count: { select: { vehicles: true } } },
      orderBy: { name: "asc" },
    });
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getVehicleColorById = async (req, res) => {
  try {
    const color = await prisma.vehicleColor.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!color) return res.status(404).json({ error: "Color not found" });
    res.json(color);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateVehicleColor = async (req, res) => {
  try {
    const { name } = req.body;
    const color = await prisma.vehicleColor.update({
      where: { id: Number(req.params.id) },
      data: { name: name?.trim() },
    });
    res.json(color);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Color not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Color name already exists" });
    res.status(500).json({ error: err.message });
  }
};

export const deleteVehicleColor = async (req, res) => {
  try {
    await prisma.vehicleColor.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Color deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Color not found" });
    res.status(500).json({ error: err.message });
  }
};
