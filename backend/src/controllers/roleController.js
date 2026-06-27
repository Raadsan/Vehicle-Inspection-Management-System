// src/controllers/roleController.js
import { prisma } from "../lib/prisma.js";

// POST /api/roles
export const createRole = async (req, res) => {
  try {
    const { companyId, name, description } = req.body;
    if (!companyId || !name) {
      return res.status(400).json({ error: "companyId and name are required" });
    }
    const role = await prisma.role.create({
      data: {
        companyId: Number(companyId),
        name,
        description,
      },
      include: { company: { select: { id: true, name: true } } },
    });
    res.status(201).json(role);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A role with this name already exists for this company" });
    }
    if (err.code === "P2003") {
      return res.status(404).json({ error: "Company not found" });
    }
    console.error("Create role error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/roles
export const getAllRoles = async (req, res) => {
  try {
    const { companyId } = req.query;
    const roles = await prisma.role.findMany({
      where: companyId ? { companyId: Number(companyId) } : undefined,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(roles);
  } catch (err) {
    console.error("Get roles error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/roles/:id
export const getRoleById = async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        company: { select: { id: true, name: true } },
        users: {
          select: { id: true, username: true, email: true, fullName: true, role: true },
        },
      },
    });
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (err) {
    console.error("Get role error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/roles/:id
export const updateRole = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const role = await prisma.role.update({
      where: { id: Number(req.params.id) },
      data: { name, description, isActive },
      include: { company: { select: { id: true, name: true } } },
    });
    res.json(role);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Role not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Role name already exists for this company" });
    console.error("Update role error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/roles/:id
export const deleteRole = async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Role not found" });
    console.error("Delete role error:", err);
    res.status(500).json({ error: err.message });
  }
};
