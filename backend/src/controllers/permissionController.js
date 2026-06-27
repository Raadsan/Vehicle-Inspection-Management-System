import { prisma } from "../lib/prisma.js";

export const createPermission = async (req, res) => {
  try {
    const { code, feature, action, description } = req.body;
    if (!code || !feature || !action) {
      return res.status(400).json({ error: "code, feature, and action are required" });
    }
    const permission = await prisma.permission.create({
      data: { code, feature, action, description },
    });
    res.status(201).json(permission);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Permission code already exists" });
    }
    console.error("Create permission error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ feature: "asc" }, { action: "asc" }],
    });
    res.json(permissions);
  } catch (err) {
    console.error("Get permissions error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPermissionById = async (req, res) => {
  try {
    const permission = await prisma.permission.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!permission) return res.status(404).json({ error: "Permission not found" });
    res.json(permission);
  } catch (err) {
    console.error("Get permission error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updatePermission = async (req, res) => {
  try {
    const { code, feature, action, description } = req.body;
    const permission = await prisma.permission.update({
      where: { id: Number(req.params.id) },
      data: { code, feature, action, description },
    });
    res.json(permission);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Permission not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Permission code already exists" });
    console.error("Update permission error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deletePermission = async (req, res) => {
  try {
    await prisma.permission.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Permission not found" });
    console.error("Delete permission error:", err);
    res.status(500).json({ error: err.message });
  }
};
