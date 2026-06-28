import { prisma } from "../lib/prisma.js";

// GET all inspection template items
export const getAllItems = async (req, res) => {
  try {
    const items = await prisma.inspectionTemplateItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json(items);
  } catch (err) {
    console.error("Get inspection items error:", err);
    res.status(500).json({ error: "Failed to fetch inspection items" });
  }
};

// POST create inspection template item
export const createItem = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Item name is required" });
    const item = await prisma.inspectionTemplateItem.create({
      data: { name: name.trim(), sortOrder: sortOrder ? Number(sortOrder) : 0 },
    });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "An item with this name already exists" });
    console.error("Create inspection item error:", err);
    res.status(500).json({ error: "Failed to create inspection item" });
  }
};

// PUT update inspection template item
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, sortOrder } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    const item = await prisma.inspectionTemplateItem.update({
      where: { id: Number(id) },
      data,
    });
    res.json(item);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Item not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "An item with this name already exists" });
    console.error("Update inspection item error:", err);
    res.status(500).json({ error: "Failed to update inspection item" });
  }
};

// DELETE inspection template item
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inspectionTemplateItem.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Item not found" });
    console.error("Delete inspection item error:", err);
    res.status(500).json({ error: "Failed to delete inspection item" });
  }
};
