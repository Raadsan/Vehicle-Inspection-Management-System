import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

// Helper: auto-generate username from company name
const slugify = (name) =>
  name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

// POST /api/companies
export const createCompany = async (req, res) => {
  try {
    const { name, email, phone, address, logo, ownerPassword } = req.body;
    if (!name) return res.status(400).json({ error: "Company name is required" });
    if (!ownerPassword) return res.status(400).json({ error: "Owner password is required" });

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    const username = slugify(name);

    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        address,
        logo,
        users: {
          create: {
            username,
            password: hashedPassword,
            email,
            fullName: name,
            role: "OWNER",
          },
        },
      },
      include: {
        users: { select: { id: true, username: true, role: true, email: true } },
      },
    });

    res.status(201).json(company);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Company name or email already exists" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: { select: { id: true, username: true, role: true } },
        _count: { select: { vehicles: true, inspectors: true, inspections: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/companies/:id
export const getCompanyById = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        users: { select: { id: true, username: true, role: true, email: true } },
        owners: true,
        inspectors: true,
        _count: { select: { vehicles: true, inspections: true, invoices: true } },
      },
    });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/companies/:id
export const updateCompany = async (req, res) => {
  try {
    const { name, email, phone, address, logo, isActive } = req.body;
    const company = await prisma.company.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, address, logo, isActive },
    });
    res.json(company);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Company not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Name or email already exists" });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/companies/:id
export const deleteCompany = async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Company not found" });
    res.status(500).json({ error: err.message });
  }
};
