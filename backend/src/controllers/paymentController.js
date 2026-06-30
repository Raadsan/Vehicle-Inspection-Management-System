import { prisma } from "../lib/prisma.js";
import { companyWhere } from "../lib/tenant.js";

const transactionInclude = {
  invoice: {
    include: {
      owner: { select: { id: true, fullName: true, phone: true } },
      vehicle: {
        include: { model: { include: { brand: true } }, vehicleColor: true },
      },
      company: { select: { id: true, name: true } },
    },
  },
};

// POST /api/payments
export const createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, reference, notes, currency } = req.body;
    if (!invoiceId || amount === undefined) {
      return res.status(400).json({ error: "invoiceId and amount are required" });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoiceId) } });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const payment = await prisma.$transaction(async (tx) => {
      const txRecord = await tx.paymentTransaction.create({
        data: {
          invoiceId: Number(invoiceId),
          amount: Number(amount),
          currency: currency || invoice.currency,
          method: method ?? "CASH",
          reference: reference || null,
          notes: notes || null,
        },
        include: transactionInclude,
      });

      const newPaid = Number(invoice.paidAmount) + Number(amount);
      const status = newPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaid, status },
      });

      return txRecord;
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payments
export const getAllPayments = async (req, res) => {
  try {
    const scope = companyWhere(req, req.query.companyId);
    const companyFilter = scope.companyId
      ? { invoice: { companyId: scope.companyId } }
      : {};

    const payments = await prisma.paymentTransaction.findMany({
      where: companyFilter,
      orderBy: { paidAt: "desc" },
      include: transactionInclude,
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
      include: transactionInclude,
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
    const { method, reference, notes } = req.body;
    const updated = await prisma.paymentTransaction.update({
      where: { id: Number(req.params.id) },
      data: {
        method: method ?? undefined,
        reference: reference !== undefined ? (reference || null) : undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
      },
      include: transactionInclude,
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
