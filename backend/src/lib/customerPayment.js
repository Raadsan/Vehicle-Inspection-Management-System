import { prisma } from "./prisma.js";

export const customerPaymentInclude = {
  owner: { select: { id: true, fullName: true, phone: true, email: true } },
  vehicle: {
    include: {
      model: { include: { brand: true } },
      vehicleColor: true,
      registrationFee: true,
    },
  },
  invoice: {
    include: { transactions: true },
  },
  company: { select: { id: true, name: true } },
};

export function generateInvoiceNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${ymd}-${Date.now().toString(36).toUpperCase()}`;
}

export function generateTransactionReference() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `TXN-${ymd}-${Date.now().toString(36).toUpperCase()}`;
}

/** Sync customer payments for all vehicles that have a primary owner. */
export async function syncCustomerPaymentsFromVehicles(companyScope = {}) {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      ...companyScope,
      vehicleOwners: { some: { isPrimary: true } },
    },
    select: { id: true },
  });

  await Promise.all(
    vehicles.map(async ({ id }) => {
      try {
        await ensureCustomerPaymentForVehicle(id);
      } catch (err) {
        console.error(`Customer payment sync failed for vehicle ${id}:`, err.message);
      }
    })
  );
}

/** Create or refresh UNPAID customer payment when vehicle has a primary owner. */
export async function ensureCustomerPaymentForVehicle(vehicleId, tx = prisma) {
  const vehicle = await tx.vehicle.findUnique({
    where: { id: Number(vehicleId) },
    include: {
      registrationFee: true,
      vehicleOwners: { where: { isPrimary: true }, take: 1 },
    },
  });
  if (!vehicle) return null;

  const primaryOwner = vehicle.vehicleOwners?.[0];
  if (!primaryOwner) return null;

  const amount = vehicle.registrationFee?.amount ?? 0;
  const currency = vehicle.registrationFee?.currency ?? "USD";

  const existingUnpaid = await tx.customerPayment.findFirst({
    where: { vehicleId: vehicle.id, status: "UNPAID" },
  });

  if (existingUnpaid) {
    return tx.customerPayment.update({
      where: { id: existingUnpaid.id },
      data: {
        ownerId: primaryOwner.ownerId,
        amount,
        currency,
      },
      include: customerPaymentInclude,
    });
  }

  const existingPaid = await tx.customerPayment.findFirst({
    where: { vehicleId: vehicle.id, status: "PAID" },
  });
  if (existingPaid) return existingPaid;

  return tx.customerPayment.create({
    data: {
      companyId: vehicle.companyId,
      ownerId: primaryOwner.ownerId,
      vehicleId: vehicle.id,
      amount,
      currency,
      status: "UNPAID",
    },
    include: customerPaymentInclude,
  });
}

/** Mark customer payment paid → creates linked invoice + payment transaction. */
export async function markCustomerPaymentPaid(paymentId, { method, reference, notes }) {
  return prisma.$transaction(async (tx) => {
    const cp = await tx.customerPayment.findUnique({
      where: { id: Number(paymentId) },
      include: {
        vehicle: true,
      },
    });
    if (!cp) {
      const err = new Error("Customer payment not found");
      err.status = 404;
      throw err;
    }
    if (cp.status === "PAID") {
      const err = new Error("Payment is already marked as paid");
      err.status = 400;
      throw err;
    }
    if (!method) {
      const err = new Error("Payment method is required");
      err.status = 400;
      throw err;
    }

    const plate = cp.vehicle?.plateNumber || `Vehicle #${cp.vehicleId}`;
    const txReference = reference?.trim() || generateTransactionReference();

    const invoice = await tx.invoice.create({
      data: {
        companyId: cp.companyId,
        ownerId: cp.ownerId,
        vehicleId: cp.vehicleId,
        invoiceNo: generateInvoiceNo(),
        totalAmount: cp.amount,
        paidAmount: cp.amount,
        currency: cp.currency,
        status: "PAID",
        notes: `Registration payment for ${plate}`,
      },
    });

    const transaction = await tx.paymentTransaction.create({
      data: {
        invoiceId: invoice.id,
        amount: cp.amount,
        currency: cp.currency,
        method,
        reference: txReference,
        notes: notes || null,
      },
    });

    const customerPayment = await tx.customerPayment.update({
      where: { id: cp.id },
      data: {
        status: "PAID",
        method,
        reference: txReference,
        notes: notes || null,
        paymentDate: new Date(),
        invoiceId: invoice.id,
      },
      include: customerPaymentInclude,
    });

    return { customerPayment, invoice, transaction };
  });
}
