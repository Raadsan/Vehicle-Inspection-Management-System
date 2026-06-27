// src/controllers/paymentController.js
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs"; // not needed but kept for potential future hashing

// Create a payment transaction (e.g., after an invoice is paid)
export const createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, status } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json({ error: "invoiceId and amount are required" });
    }
    const payment = await prisma.paymentTransaction.create({
      data: {
        invoiceId: Number(invoiceId),
        amount: Number(amount),
        method: method ?? "CASH",
        status: status ?? "SUCCESS",
      },
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all payment transactions (optional filter by company via invoice relationship)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      include: { invoice: { select: { id: true, companyId: true } } },
    });
    res.json(payments);
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: Number(req.params.id) },
      include: { invoice: true },
    });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error("Get payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { amount, method, status } = req.body;
    const updated = await prisma.paymentTransaction.update({
      where: { id: Number(req.params.id) },
      data: {
        amount: amount ? Number(amount) : undefined,
        method,
        status,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Payment not found" });
    console.error("Update payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    await prisma.paymentTransaction.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Payment not found" });
    console.error("Delete payment error:", err);
    res.status(500).json({ error: err.message });
  }
};
