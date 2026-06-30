import { prisma } from "../lib/prisma.js";
import { companyWhere } from "../lib/tenant.js";

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function moneyTotal(rows, field = "amount") {
  return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
}

function vehicleName(vehicle) {
  const brand = vehicle?.model?.brand?.name;
  const model = vehicle?.model?.name;
  return [brand, model, vehicle?.year].filter(Boolean).join(" ") || "Unknown Vehicle";
}

export const getDashboardStats = async (req, res) => {
  try {
    const scope = companyWhere(req, req.query.companyId);
    const today = startOfDay(new Date());
    const weekStart = addDays(today, -6);
    const monthStart = startOfMonth(addMonths(today, -5));

    const [
      totalVehicles,
      totalOwners,
      totalInspectors,
      totalInspections,
      pendingInspections,
      completedInspections,
      approvedInspections,
      failedInspections,
      totalInvoices,
      unpaidInvoices,
      paidCustomerPayments,
      unpaidCustomerPayments,
      weeklyInspections,
      weeklyPayments,
      monthlyInspections,
      brandRows,
      recentInspections,
    ] = await Promise.all([
      prisma.vehicle.count({ where: scope }),
      prisma.owner.count({ where: scope }),
      prisma.inspector.count({ where: scope }),
      prisma.inspection.count({ where: scope }),
      prisma.inspection.count({ where: { ...scope, status: { in: ["PENDING", "AWAITING_APPROVAL"] } } }),
      prisma.inspection.count({ where: { ...scope, status: { in: ["COMPLETED", "APPROVED"] } } }),
      prisma.inspection.count({ where: { ...scope, status: "APPROVED" } }),
      prisma.inspection.count({ where: { ...scope, overallResult: "FAIL" } }),
      prisma.invoice.count({ where: scope }),
      prisma.invoice.count({ where: { ...scope, status: { in: ["UNPAID", "PARTIAL"] } } }),
      prisma.customerPayment.findMany({ where: { ...scope, status: "PAID" }, select: { amount: true } }),
      prisma.customerPayment.findMany({ where: { ...scope, status: "UNPAID" }, select: { amount: true } }),
      prisma.inspection.findMany({
        where: { ...scope, createdAt: { gte: weekStart } },
        select: { createdAt: true },
      }),
      prisma.customerPayment.findMany({
        where: { ...scope, status: "PAID", paymentDate: { gte: weekStart } },
        select: { amount: true, paymentDate: true },
      }),
      prisma.inspection.findMany({
        where: { ...scope, createdAt: { gte: monthStart } },
        select: { createdAt: true, overallResult: true },
      }),
      prisma.vehicle.findMany({
        where: scope,
        select: {
          model: { select: { brand: { select: { name: true } } } },
        },
      }),
      prisma.inspection.findMany({
        where: scope,
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              year: true,
              registrationFee: { select: { amount: true } },
              model: { select: { name: true, brand: { select: { name: true } } } },
            },
          },
          inspector: { select: { fullName: true } },
          company: { select: { name: true } },
        },
      }),
    ]);

    const paidAmount = moneyTotal(paidCustomerPayments);
    const unpaidAmount = moneyTotal(unpaidCustomerPayments);
    const weeklyAnalytics = Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(weekStart, index);
      const nextDay = addDays(day, 1);
      return {
        name: day.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: weeklyPayments
          .filter((payment) => payment.paymentDate >= day && payment.paymentDate < nextDay)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
        inspections: weeklyInspections.filter((inspection) => inspection.createdAt >= day && inspection.createdAt < nextDay).length,
      };
    });

    const monthlyTrends = Array.from({ length: 6 }).map((_, index) => {
      const month = addMonths(monthStart, index);
      const nextMonth = addMonths(month, 1);
      const rows = monthlyInspections.filter((inspection) => inspection.createdAt >= month && inspection.createdAt < nextMonth);
      return {
        name: month.toLocaleDateString("en-US", { month: "short" }),
        total: rows.length,
        passed: rows.filter((inspection) => inspection.overallResult === "PASS").length,
        failed: rows.filter((inspection) => inspection.overallResult === "FAIL").length,
      };
    });

    const brandCounts = brandRows.reduce((map, vehicle) => {
      const brand = vehicle.model?.brand?.name || "Unknown";
      map.set(brand, (map.get(brand) || 0) + 1);
      return map;
    }, new Map());
    const vehicleCategoryData = Array.from(brandCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    res.json({
      totalVehicles,
      totalOwners,
      totalInspectors,
      totalInspections,
      pendingInspections,
      completedInspections,
      approvedInspections,
      failedInspections,
      totalInvoices,
      unpaidInvoices,
      paidAmount,
      unpaidAmount,
      totalRevenue: paidAmount,
      weeklyAnalytics,
      monthlyTrends,
      vehicleCategoryData,
      recentInspections: recentInspections.map((inspection) => ({
        id: inspection.id,
        inspectionNo: `INS-${String(inspection.id).padStart(4, "0")}`,
        vehicle: vehicleName(inspection.vehicle),
        plate: inspection.vehicle?.plateNumber || "—",
        inspector: inspection.inspector?.fullName || "Not assigned",
        status: inspection.status,
        result: inspection.overallResult,
        date: inspection.completedAt || inspection.scheduledAt || inspection.createdAt,
        total: Number(inspection.vehicle?.registrationFee?.amount || 0),
      })),
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
};
