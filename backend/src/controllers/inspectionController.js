import { prisma } from "../lib/prisma.js";
import { resolveCompanyId, companyWhere } from "../lib/tenant.js";

const ACTIVE_INSPECTION_STATUSES = ["PENDING", "IN_PROGRESS", "AWAITING_APPROVAL"];

const TX_OPTIONS = { maxWait: 15000, timeout: 60000 };

const createdByUserSelect = {
  id: true,
  fullName: true,
  username: true,
  role: true,
  company: { select: { id: true, name: true } },
};

async function attachCreatedByUsers(records) {
  const list = Array.isArray(records) ? records : [records];
  const ids = [...new Set(list.map((i) => i.createdByUserId).filter(Boolean))];
  if (ids.length === 0) {
    return Array.isArray(records)
      ? records.map((i) => ({ ...i, createdByUser: null }))
      : { ...records, createdByUser: null };
  }
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: createdByUserSelect,
  });
  const map = new Map(users.map((u) => [u.id, u]));
  const enrich = (i) => ({
    ...i,
    createdByUser: i.createdByUserId ? map.get(i.createdByUserId) ?? null : null,
  });
  return Array.isArray(records) ? records.map(enrich) : enrich(records);
}

const listInspectionInclude = {
  company: { select: { id: true, name: true } },
  vehicle: {
    select: {
      id: true,
      plateNumber: true,
      vin: true,
      color: true,
      year: true,
      model: { include: { brand: true } },
      vehicleColor: { select: { id: true, name: true } },
      vehicleOwners: {
        where: { isPrimary: true },
        include: { owner: { select: { id: true, fullName: true, phone: true } } },
        take: 1,
      },
    },
  },
  inspector: { select: { id: true, fullName: true, phone: true, email: true } },
};

const mapPassFailToItemResult = (result) => {
  if (result === "FAIL") return "DEFECTIVE";
  if (result === "PASS") return "OK";
  return result;
};

async function saveInspectionItemsWithResults(tx, inspectionId, items) {
  const id = Number(inspectionId);

  await tx.inspectionItem.createMany({
    data: items.map((item, i) => ({
      inspectionId: id,
      category: item.category || "General",
      itemName: item.itemName,
      isRequired: item.isRequired !== false,
      sortOrder: item.sortOrder ?? i,
    })),
  });

  const createdItems = await tx.inspectionItem.findMany({
    where: { inspectionId: id },
    orderBy: { sortOrder: "asc" },
  });

  if (createdItems.length === 0) return;

  const itemBySortOrder = new Map(createdItems.map((row) => [row.sortOrder, row]));

  await tx.inspectionResultRecord.createMany({
    data: items.map((item, i) => {
      const sortOrder = item.sortOrder ?? i;
      const row = itemBySortOrder.get(sortOrder);
      if (!row) {
        throw new Error(`Failed to link result for inspection item at sort order ${sortOrder}`);
      }
      return {
        inspectionId: id,
        itemId: row.id,
        result: mapPassFailToItemResult(item.result || "PASS"),
        remarks: item.remarks || null,
      };
    }),
  });
}

function computeOverallResult(items) {
  const anyFail = items.some((item) => item.result === "FAIL");
  return anyFail ? "FAIL" : "PASS";
}

async function expireApprovedInspections(scope = {}) {
  const now = new Date();
  await prisma.inspection.updateMany({
    where: {
      ...scope,
      status: "APPROVED",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
}

async function assertVehicleAvailableForSchedule(vehicleId, excludeInspectionId = null) {
  const existing = await prisma.inspection.findFirst({
    where: {
      vehicleId: Number(vehicleId),
      status: { in: ACTIVE_INSPECTION_STATUSES },
      ...(excludeInspectionId ? { NOT: { id: Number(excludeInspectionId) } } : {}),
    },
  });
  if (existing) {
    const err = new Error("This vehicle already has an active inspection scheduled");
    err.statusCode = 409;
    throw err;
  }
}

function resolveInspectionState(vehicle, history) {
  const now = new Date();
  const inspection = history[0];
  const activeInspection = history.find(
    (row) =>
      row.status === "APPROVED" &&
      row.overallResult !== "FAIL" &&
      (!row.expiresAt || row.expiresAt >= now)
  );

  if (vehicle.status !== "ACTIVE") {
    return {
      inspectionState: "INACTIVE",
      isValid: false,
      message: "Vehicle is inactive.",
      activeInspection: null,
    };
  }

  if (!inspection) {
    return {
      inspectionState: "INACTIVE",
      isValid: false,
      message: "Vehicle has no inspection record.",
      activeInspection: null,
    };
  }

  if (activeInspection) {
    return {
      inspectionState: "ACTIVE",
      isValid: true,
      message: "Vehicle inspection is active and valid.",
      activeInspection,
    };
  }

  if (history.some((row) => row.status === "EXPIRED" || (row.status === "APPROVED" && row.expiresAt && row.expiresAt < now))) {
    return {
      inspectionState: "EXPIRED",
      isValid: false,
      message: "Vehicle inspection has expired.",
      activeInspection: null,
    };
  }

  if (["REJECTED", "CANCELLED"].includes(inspection.status) || inspection.overallResult === "FAIL") {
    return {
      inspectionState: "INVALID",
      isValid: false,
      message: "Vehicle inspection is invalid.",
      activeInspection: null,
    };
  }

  return {
    inspectionState: "INACTIVE",
    isValid: false,
    message: "Vehicle inspection is not approved yet.",
    activeInspection: null,
  };
}

// GET /api/inspections/verify?plateNumber=ABC123
export const verifyVehicleInspection = async (req, res) => {
  try {
    const { plateNumber, vin, vehicleId } = req.query;
    if (!plateNumber && !vin && !vehicleId) {
      return res.status(400).json({
        error: "Provide one of: plateNumber, vin, or vehicleId",
      });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        ...(vehicleId ? { id: Number(vehicleId) } : {}),
        ...(plateNumber ? { plateNumber: String(plateNumber).trim() } : {}),
        ...(vin ? { vin: String(vin).trim() } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        model: { include: { brand: true } },
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        inspectionState: "NOT_FOUND",
        isValid: false,
        message: "Vehicle not found.",
      });
    }

    await expireApprovedInspections({ vehicleId: vehicle.id });

    const inspectionHistory = await prisma.inspection.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: [
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        status: true,
        overallResult: true,
        scheduledAt: true,
        completedAt: true,
        approvedAt: true,
        expiresAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const state = resolveInspectionState(vehicle, inspectionHistory);

    res.json({
      ...state,
      checkedAt: new Date(),
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        vin: vehicle.vin,
        status: vehicle.status,
        brand: vehicle.model?.brand?.name || null,
        model: vehicle.model?.name || null,
        year: vehicle.year,
        company: vehicle.company,
      },
      latestInspection: state.activeInspection || inspectionHistory[0] || null,
      activeInspection: state.activeInspection,
      inspectionHistory,
    });
  } catch (error) {
    console.error("Verify vehicle inspection error:", error);
    res.status(500).json({ error: error.message || "Failed to verify vehicle inspection" });
  }
};

export const createInspection = async (req, res) => {
  try {
    const {
      companyId,
      vehicleId,
      inspectorId,
      scheduledAt,
      startedAt,
      completedAt,
      status,
      notes,
      overallResult,
      items,
    } = req.body;
    const targetCompanyId = resolveCompanyId(req, companyId);
    if (!vehicleId) {
      return res.status(400).json({ error: "vehicleId is required" });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (vehicle.companyId !== targetCompanyId && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Vehicle does not belong to your company" });
    }

    const hasItems = Array.isArray(items) && items.length > 0;
    await assertVehicleAvailableForSchedule(vehicleId);
    let finalStatus = status || "PENDING";
    let finalOverallResult = overallResult;
    let finalCompletedAt = completedAt ? new Date(completedAt) : null;

    if (hasItems) {
      finalStatus = "AWAITING_APPROVAL";
      finalCompletedAt = finalCompletedAt || new Date();
      finalOverallResult = computeOverallResult(items);
    }

    const inspectionInclude = {
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          color: true,
          year: true,
          model: { include: { brand: true } },
          vehicleOwners: {
            where: { isPrimary: true },
            include: { owner: { select: { id: true, fullName: true, phone: true } } },
            take: 1,
          },
        },
      },
      inspector: true,
      company: { select: { id: true, name: true } },
      inspectionItems: { include: { inspectionResults: true }, orderBy: { sortOrder: "asc" } },
    };

    const inspection = await prisma.$transaction(async (tx) => {
      const created = await tx.inspection.create({
        data: {
          companyId: targetCompanyId,
          vehicleId: Number(vehicleId),
          inspectorId: inspectorId ? Number(inspectorId) : null,
          createdByUserId: req.user?.id ? Number(req.user.id) : null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          startedAt: startedAt ? new Date(startedAt) : hasItems ? new Date() : null,
          completedAt: finalCompletedAt,
          status: finalStatus,
          notes,
          overallResult: finalOverallResult,
        },
      });

      if (hasItems) {
        await saveInspectionItemsWithResults(tx, created.id, items);
      }

      return tx.inspection.findUnique({
        where: { id: created.id },
        include: inspectionInclude,
      });
    }, TX_OPTIONS);

    res.status(201).json(await attachCreatedByUsers(inspection));
  } catch (error) {
    console.error("Create Inspection error:", error);
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || "Failed to create inspection" });
  }
};

export const getInspections = async (req, res) => {
  try {
    const { status } = req.query;
    const scope = companyWhere(req, req.query.companyId);

    try {
      await expireApprovedInspections(scope);
    } catch (expireErr) {
      console.error("Expire approved inspections error:", expireErr);
    }

    const inspections = await prisma.inspection.findMany({
      where: {
        ...scope,
        ...(status && { status }),
      },
      include: listInspectionInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(await attachCreatedByUsers(inspections));
  } catch (error) {
    console.error("Get Inspections error:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
};

export const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await prisma.inspection.findUnique({
      where: { id: Number(id) },
      include: {
        company: true,
        vehicle: {
          include: {
            model: { include: { brand: true } },
            vehicleOwners: {
              where: { isPrimary: true },
              include: { owner: { select: { id: true, fullName: true, phone: true } } },
              take: 1,
            },
          },
        },
        inspector: true,
        inspectionItems: { include: { inspectionResults: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!inspection) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && inspection.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(await attachCreatedByUsers(inspection));
  } catch (error) {
    console.error("Get Inspection by ID error:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
};

export const completeInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, notes } = req.body;

    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && existing.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Inspection items are required" });
    }

    const anyFail = items.some((item) => item.result === "FAIL");
    const overallResult = anyFail ? "FAIL" : "PASS";

    const inspectionInclude = {
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          color: true,
          year: true,
          model: { include: { brand: true } },
          vehicleOwners: {
            where: { isPrimary: true },
            include: { owner: { select: { id: true, fullName: true, phone: true } } },
            take: 1,
          },
        },
      },
      inspector: true,
      company: { select: { id: true, name: true } },
      inspectionItems: { include: { inspectionResults: true }, orderBy: { sortOrder: "asc" } },
    };

    const inspection = await prisma.$transaction(async (tx) => {
      await tx.inspectionResultRecord.deleteMany({ where: { inspectionId: Number(id) } });
      await tx.inspectionItem.deleteMany({ where: { inspectionId: Number(id) } });
      await saveInspectionItemsWithResults(tx, id, items);

      return tx.inspection.update({
        where: { id: Number(id) },
        data: {
          status: "AWAITING_APPROVAL",
          overallResult,
          completedAt: new Date(),
          startedAt: existing.startedAt || new Date(),
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: inspectionInclude,
      });
    }, TX_OPTIONS);

    res.json(await attachCreatedByUsers(inspection));
  } catch (error) {
    console.error("Complete Inspection error:", error);
    res.status(500).json({ error: error.message || "Failed to complete inspection" });
  }
};

export const updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && existing.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { vehicleId, inspectorId, scheduledAt, startedAt, completedAt, status, notes, overallResult } = req.body;

    const data = {};
    if (vehicleId !== undefined) data.vehicleId = Number(vehicleId);
    if (inspectorId !== undefined) data.inspectorId = inspectorId ? Number(inspectorId) : null;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (startedAt !== undefined) data.startedAt = startedAt ? new Date(startedAt) : null;
    if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (overallResult !== undefined) data.overallResult = overallResult;

    const inspection = await prisma.inspection.update({
      where: { id: Number(id) },
      data,
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(await attachCreatedByUsers(inspection));
  } catch (error) {
    console.error("Update Inspection error:", error);
    res.status(500).json({ error: "Failed to update inspection" });
  }
};

export const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });

    const scope = companyWhere(req);
    if (scope.companyId && existing.companyId !== scope.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.inspection.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error("Delete Inspection error:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
};

// POST /api/inspections/:id/approve
export const approveInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });
    if (existing.status !== "AWAITING_APPROVAL") {
      return res.status(400).json({ error: `Cannot approve an inspection with status '${existing.status}'. It must be in AWAITING_APPROVAL state.` });
    }

    const approvedAt = new Date();
    const expiresAt = new Date(approvedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    expiresAt.setDate(expiresAt.getDate() - 1);

    const inspection = await prisma.inspection.update({
      where: { id: Number(id) },
      data: {
        status: "APPROVED",
        approvedAt,
        expiresAt,
        notes: notes || existing.notes,
      },
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(await attachCreatedByUsers(inspection));
  } catch (error) {
    console.error("Approve Inspection error:", error);
    res.status(500).json({ error: "Failed to approve inspection" });
  }
};

export const rejectInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const existing = await prisma.inspection.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: "Inspection not found" });
    if (existing.status !== "AWAITING_APPROVAL") {
      return res.status(400).json({ error: `Cannot reject an inspection with status '${existing.status}'. It must be in AWAITING_APPROVAL state.` });
    }

    const inspection = await prisma.inspection.update({
      where: { id: Number(id) },
      data: {
        status: "REJECTED",
        notes: notes || existing.notes,
      },
      include: {
        vehicle: true,
        inspector: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(await attachCreatedByUsers(inspection));
  } catch (error) {
    console.error("Reject Inspection error:", error);
    res.status(500).json({ error: "Failed to reject inspection" });
  }
};
