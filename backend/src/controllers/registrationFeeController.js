import { prisma } from "../lib/prisma.js";

// GET all registration fees
export const getAllRegistrationFees = async (req, res) => {
  try {
    const { companyId } = req.query;
    const userCompanyId = req.user?.companyId;
    const userRole = req.user?.role;

    let where = {};
    if (userRole === "OWNER") {
      where.companyId = userCompanyId;
    } else if (companyId) {
      where.companyId = Number(companyId);
    }

    const fees = await prisma.registrationFee.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      orderBy: { purpose: "asc" },
    });
    res.json(fees);
  } catch (err) {
    console.error("Get registration fees error:", err);
    res.status(500).json({ error: "Failed to fetch registration fees" });
  }
};

// GET registration fee by ID
export const getRegistrationFeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await prisma.registrationFee.findUnique({
      where: { id: Number(id) },
      include: { company: true, vehicles: true },
    });
    if (!fee) return res.status(404).json({ error: "Registration fee not found" });
    res.json(fee);
  } catch (err) {
    console.error("Get registration fee error:", err);
    res.status(500).json({ error: "Failed to fetch registration fee" });
  }
};

// POST create registration fee
export const createRegistrationFee = async (req, res) => {
  try {
    const { purpose, amount, currency, companyId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId || 1;

    if (!purpose?.trim()) return res.status(400).json({ error: "Purpose is required" });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Valid amount is required" });

    const fee = await prisma.registrationFee.create({
      data: {
        companyId: Number(targetCompanyId),
        purpose: purpose.trim(),
        amount: Number(amount),
        currency: currency || "USD",
      },
      include: { company: { select: { id: true, name: true } } },
    });
    res.status(201).json(fee);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A fee with this purpose already exists for this company" });
    console.error("Create registration fee error:", err);
    res.status(500).json({ error: "Failed to create registration fee" });
  }
};

// PUT update registration fee
export const updateRegistrationFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { purpose, amount, currency, isActive } = req.body;

    const data = {};
    if (purpose !== undefined) data.purpose = purpose.trim();
    if (amount !== undefined) data.amount = Number(amount);
    if (currency !== undefined) data.currency = currency;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const fee = await prisma.registrationFee.update({
      where: { id: Number(id) },
      data,
      include: { company: { select: { id: true, name: true } } },
    });
    res.json(fee);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Registration fee not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "A fee with this purpose already exists for this company" });
    console.error("Update registration fee error:", err);
    res.status(500).json({ error: "Failed to update registration fee" });
  }
};

// DELETE registration fee
export const deleteRegistrationFee = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.registrationFee.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Registration fee not found" });
    console.error("Delete registration fee error:", err);
    res.status(500).json({ error: "Failed to delete registration fee" });
  }
};
