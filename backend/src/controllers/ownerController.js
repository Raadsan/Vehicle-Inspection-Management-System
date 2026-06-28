import { prisma } from "../lib/prisma.js";
import { resolveCompanyId, companyWhere } from "../lib/tenant.js";

// POST /api/owners
export const createOwner = async (req, res) => {
  try {
    const { companyId, fullName, phone, email, address, idNumber } = req.body;
    const targetCompanyId = resolveCompanyId(req, companyId);
    if (!fullName) return res.status(400).json({ error: "fullName is required" });
    if (!phone) return res.status(400).json({ error: "phone is required" });
    const owner = await prisma.owner.create({
      data: {
        companyId: Number(targetCompanyId),
        fullName,
        phone,
        email: email || null,
        address: address || null,
        idNumber: idNumber || null,
      },
      include: { company: { select: { id: true, name: true } } },
    });
    res.status(201).json(owner);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "ID number already exists" });
    if (err.code === "P2003") return res.status(404).json({ error: "Company not found" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/owners
export const getAllOwners = async (req, res) => {
  try {
    const { companyId } = req.query;
    const scope = companyWhere(req, companyId);
    const owners = await prisma.owner.findMany({
      where: scope,
      include: {
        company: { select: { id: true, name: true } },
        vehicleOwners: { include: { vehicle: { include: { model: { include: { brand: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(owners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/owners/:id
export const getOwnerById = async (req, res) => {
  try {
    const owner = await prisma.owner.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        company: { select: { id: true, name: true } },
        vehicleOwners: { include: { vehicle: { include: { model: { include: { brand: true } } } } } },
        customerPayments: true,
        invoices: true,
      },
    });
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    res.json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/owners/:id
export const updateOwner = async (req, res) => {
  try {
    const { fullName, phone, email, address, idNumber } = req.body;
    const owner = await prisma.owner.update({
      where: { id: Number(req.params.id) },
      data: {
        fullName,
        phone,
        email: email !== undefined ? (email || null) : undefined,
        address: address !== undefined ? (address || null) : undefined,
        idNumber: idNumber !== undefined ? (idNumber || null) : undefined,
      },
    });
    res.json(owner);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Owner not found" });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/owners/:id
export const deleteOwner = async (req, res) => {
  try {
    await prisma.owner.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Owner deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Owner not found" });
    res.status(500).json({ error: err.message });
  }
};
