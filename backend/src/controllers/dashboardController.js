import { prisma } from "../lib/prisma.js";
import { companyWhere } from "../lib/tenant.js";

export const getDashboardStats = async (req, res) => {
  try {
    const scope = companyWhere(req, req.query.companyId);

    const [
      totalVehicles,
      totalOwners,
      totalInspections,
      pendingInspections,
      completedInspections,
      recentInspections,
    ] = await Promise.all([
      prisma.vehicle.count({ where: scope }),
      prisma.owner.count({ where: scope }),
      prisma.inspection.count({ where: scope }),
      prisma.inspection.count({ where: { ...scope, status: "PENDING" } }),
      prisma.inspection.count({ where: { ...scope, status: "COMPLETED" } }),
      prisma.inspection.findMany({
        where: scope,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: { select: { plateNumber: true } },
          inspector: { select: { fullName: true } },
          company: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      totalVehicles,
      totalOwners,
      totalInspections,
      pendingInspections,
      completedInspections,
      recentInspections,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
