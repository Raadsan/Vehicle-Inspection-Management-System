import { prisma } from "../lib/prisma.js";
import { companyWhere } from "../lib/tenant.js";

const invoiceInclude = {
  owner: { select: { id: true, fullName: true, phone: true, email: true } },
  vehicle: {
    include: {
      model: { include: { brand: true } },
      vehicleColor: true,
    },
  },
  transactions: true,
  customerPayments: true,
  company: { select: { id: true, name: true } },
};

// GET /api/invoices
export const getAllInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    const scope = companyWhere(req, req.query.companyId);

    const invoices = await prisma.invoice.findMany({
      where: {
        ...scope,
        ...(status && { status }),
      },
      include: invoiceInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    console.error("Get invoices error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: invoiceInclude,
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    console.error("Get invoice error:", err);
    res.status(500).json({ error: err.message });
  }
};
