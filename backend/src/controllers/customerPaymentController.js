import { prisma } from "../lib/prisma.js";
import { companyWhere } from "../lib/tenant.js";
import {
  customerPaymentInclude,
  ensureCustomerPaymentForVehicle,
  markCustomerPaymentPaid,
  syncCustomerPaymentsFromVehicles,
} from "../lib/customerPayment.js";

const VALID_METHODS = ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "EVC", "MERCHANT", "CARD", "OTHER"];

// GET /api/customer-payments
export const getAllCustomerPayments = async (req, res) => {
  try {
    const { status } = req.query;
    const scope = companyWhere(req, req.query.companyId);

    // Auto-create payments for vehicles with owners (including existing vehicles)
    await syncCustomerPaymentsFromVehicles(scope);

    const payments = await prisma.customerPayment.findMany({
      where: {
        ...scope,
        ...(status && { status }),
      },
      include: customerPaymentInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (err) {
    console.error("Get customer payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/customer-payments/:id
export const getCustomerPaymentById = async (req, res) => {
  try {
    const payment = await prisma.customerPayment.findUnique({
      where: { id: Number(req.params.id) },
      include: customerPaymentInclude,
    });
    if (!payment) return res.status(404).json({ error: "Customer payment not found" });
    res.json(payment);
  } catch (err) {
    console.error("Get customer payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/customer-payments/:id
export const updateCustomerPayment = async (req, res) => {
  try {
    const { amount, currency, notes } = req.body;
    const existing = await prisma.customerPayment.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!existing) return res.status(404).json({ error: "Customer payment not found" });
    if (existing.status === "PAID") {
      return res.status(400).json({ error: "Cannot edit a paid customer payment" });
    }

    const data = {};
    if (amount !== undefined) data.amount = Number(amount);
    if (currency !== undefined) data.currency = currency;
    if (notes !== undefined) data.notes = notes || null;

    const updated = await prisma.customerPayment.update({
      where: { id: Number(req.params.id) },
      data,
      include: customerPaymentInclude,
    });
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Customer payment not found" });
    console.error("Update customer payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/customer-payments/:id/paid
export const approveCustomerPaymentPaid = async (req, res) => {
  try {
    const { method, reference, notes } = req.body;
    if (!method || !VALID_METHODS.includes(method)) {
      return res.status(400).json({
        error: "Valid payment method is required (EVC, MERCHANT, BANK_TRANSFER, CASH, etc.)",
      });
    }

    const result = await markCustomerPaymentPaid(Number(req.params.id), {
      method,
      reference,
      notes,
    });
    res.json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    if (err.status === 400) return res.status(400).json({ error: err.message });
    console.error("Approve customer payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/customer-payments/sync-all
export const syncAllCustomerPayments = async (req, res) => {
  try {
    const scope = companyWhere(req, req.query.companyId);
    await syncCustomerPaymentsFromVehicles(scope);
    const payments = await prisma.customerPayment.findMany({
      where: scope,
      include: customerPaymentInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ synced: payments.length, payments });
  } catch (err) {
    console.error("Sync all customer payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/customer-payments/sync/:vehicleId — manual sync for existing vehicles
export const syncCustomerPaymentForVehicle = async (req, res) => {
  try {
    const payment = await ensureCustomerPaymentForVehicle(Number(req.params.vehicleId));
    if (!payment) {
      return res.status(400).json({ error: "Vehicle not found or has no primary owner assigned" });
    }
    res.json(payment);
  } catch (err) {
    console.error("Sync customer payment error:", err);
    res.status(500).json({ error: err.message });
  }
};
