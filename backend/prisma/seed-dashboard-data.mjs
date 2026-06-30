import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

const SAMPLE_PREFIX = "KGS";
const VEHICLE_COUNT = 30;
const INSPECTION_COUNT = 45;

function pick(items, index) {
  return items[index % items.length];
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function getCompany() {
  const existing = await prisma.company.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  return prisma.company.create({
    data: {
      name: "KGS Car Inspection",
      email: "info@kgsinspection.com",
      phone: "+252610000000",
      address: "Mogadishu, Somalia",
      logo: "/small-logo.png",
    },
  });
}

async function ensureUser(companyId) {
  const existing = await prisma.user.findFirst({ where: { companyId } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      companyId,
      username: "kgs_admin",
      password: await bcrypt.hash("admin123", 10),
      email: "admin@kgsinspection.com",
      fullName: "KGS Admin",
      role: "SUPER_ADMIN",
    },
  });
}

async function ensureReferenceData(companyId) {
  const brandNames = ["Toyota", "Nissan", "Honda", "Hyundai", "Mitsubishi", "Mercedes", "Ford", "Kia"];
  const modelNames = {
    Toyota: ["Corolla", "Camry", "Land Cruiser", "Hilux"],
    Nissan: ["Sunny", "Patrol", "X-Trail", "Navara"],
    Honda: ["Civic", "Accord", "CR-V", "Fit"],
    Hyundai: ["Elantra", "Tucson", "Santa Fe", "H1"],
    Mitsubishi: ["Pajero", "L200", "Outlander", "Rosa"],
    Mercedes: ["C-Class", "E-Class", "Sprinter", "Actros"],
    Ford: ["Ranger", "Explorer", "Transit", "Focus"],
    Kia: ["Sportage", "Sorento", "Rio", "K5"],
  };
  const colors = ["White", "Black", "Blue", "Silver", "Gray", "Red", "Green", "Gold"];

  const brands = [];
  const models = [];
  for (const name of brandNames) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    brands.push(brand);
    for (const modelName of modelNames[name]) {
      const model = await prisma.vehicleModel.upsert({
        where: { brandId_name: { brandId: brand.id, name: modelName } },
        create: { brandId: brand.id, name: modelName, year: 2020 },
        update: {},
      });
      models.push(model);
    }
  }

  const vehicleColors = [];
  for (const name of colors) {
    vehicleColors.push(await prisma.vehicleColor.upsert({ where: { name }, create: { name }, update: {} }));
  }

  const registrationFee = await prisma.registrationFee.upsert({
    where: { companyId_purpose: { companyId, purpose: "Vehicle Registration Fee" } },
    create: { companyId, purpose: "Vehicle Registration Fee", amount: 35, currency: "USD", isActive: true },
    update: { amount: 35, currency: "USD", isActive: true },
  });

  return { models, vehicleColors, registrationFee };
}

async function seedOwners(companyId) {
  const names = [
    "Abdi Hassan", "Amina Yusuf", "Mohamed Ali", "Fadumo Ahmed", "Hassan Omar",
    "Maryan Abdulle", "Ali Warsame", "Khadija Nur", "Omar Farah", "Sahra Mohamed",
  ];
  const owners = [];
  for (let i = 0; i < VEHICLE_COUNT; i++) {
    const fullName = `${pick(names, i)} ${i + 1}`;
    const idNumber = `${SAMPLE_PREFIX}-ID-${String(i + 1).padStart(4, "0")}`;
    const owner = await prisma.owner.upsert({
      where: { idNumber },
      create: {
        companyId,
        fullName,
        phone: `+25261${String(7000000 + i).padStart(7, "0")}`,
        email: `owner${i + 1}@kgs.demo`,
        address: `District ${1 + (i % 8)}, Mogadishu`,
        idNumber,
      },
      update: {},
    });
    owners.push(owner);
  }
  return owners;
}

async function seedInspectors(companyId) {
  const names = ["Ahmed Inspector", "Hodan Technician", "Yusuf Mechanic", "Nimco Inspector", "Abshir Quality"];
  const inspectors = [];
  for (let i = 0; i < names.length; i++) {
    const licenseNo = `${SAMPLE_PREFIX}-INS-${String(i + 1).padStart(3, "0")}`;
    const existing = await prisma.inspector.findFirst({ where: { licenseNo } });
    inspectors.push(existing || await prisma.inspector.create({
      data: {
        companyId,
        fullName: names[i],
        phone: `+25262${String(8000000 + i).padStart(7, "0")}`,
        email: `inspector${i + 1}@kgs.demo`,
        licenseNo,
      },
    }));
  }
  return inspectors;
}

async function seedVehicles(companyId, userId, owners, inspectors, models, vehicleColors, registrationFee) {
  const existingCount = await prisma.vehicle.count({
    where: { plateNumber: { startsWith: `${SAMPLE_PREFIX}-` } },
  });
  if (existingCount >= VEHICLE_COUNT) {
    return prisma.vehicle.findMany({
      where: { plateNumber: { startsWith: `${SAMPLE_PREFIX}-` } },
      take: VEHICLE_COUNT,
      include: { vehicleOwners: true },
    });
  }

  const vehicles = [];
  for (let i = 0; i < VEHICLE_COUNT; i++) {
    const model = pick(models, i);
    const color = pick(vehicleColors, i);
    const plateNumber = `${SAMPLE_PREFIX}-${String(1000 + i)}`;
    const vin = `${SAMPLE_PREFIX}VIN${String(100000000 + i)}`;
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber },
      create: {
        companyId,
        modelId: model.id,
        colorId: color.id,
        color: color.name,
        year: 2018 + (i % 7),
        plateNumber,
        vin,
        mileage: 12000 + i * 850,
        logbookNumber: `${SAMPLE_PREFIX}-LOG-${String(i + 1).padStart(4, "0")}`,
        registrationFeeId: registrationFee.id,
        createdByUserId: userId,
        status: i % 13 === 0 ? "INACTIVE" : "ACTIVE",
      },
      update: {},
    });
    await prisma.vehicleOwner.upsert({
      where: { vehicleId_ownerId: { vehicleId: vehicle.id, ownerId: owners[i].id } },
      create: { vehicleId: vehicle.id, ownerId: owners[i].id, isPrimary: true },
      update: { isPrimary: true },
    });
    await prisma.vehicleInspector.upsert({
      where: { vehicleId_inspectorId: { vehicleId: vehicle.id, inspectorId: pick(inspectors, i).id } },
      create: { vehicleId: vehicle.id, inspectorId: pick(inspectors, i).id },
      update: {},
    });
    vehicles.push(vehicle);
  }
  return vehicles;
}

async function seedInspections(companyId, userId, vehicles, inspectors) {
  const existingCount = await prisma.inspection.count({
    where: { companyId, notes: { contains: "KGS sample inspection" } },
  });
  if (existingCount >= INSPECTION_COUNT) return;

  const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED"];
  const results = [null, null, "PASS", "PASS", "PASS", "FAIL", "CONDITIONAL"];
  const checklist = [
    ["Brakes", "Brake pedal and pads"],
    ["Lights", "Headlights and indicators"],
    ["Engine", "Engine condition"],
    ["Tyres", "Tyre condition"],
    ["Body", "Body and chassis"],
  ];

  for (let i = 0; i < INSPECTION_COUNT; i++) {
    const status = pick(statuses, i);
    const overallResult = ["COMPLETED", "APPROVED", "REJECTED", "EXPIRED"].includes(status) ? pick(results, i) || "PASS" : null;
    const createdAt = daysAgo(i % 45);
    const inspection = await prisma.inspection.create({
      data: {
        companyId,
        vehicleId: pick(vehicles, i).id,
        inspectorId: pick(inspectors, i).id,
        createdByUserId: userId,
        scheduledAt: daysAgo((i % 45) + 1),
        startedAt: ["IN_PROGRESS", "COMPLETED", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED"].includes(status) ? createdAt : null,
        completedAt: ["COMPLETED", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED"].includes(status) ? createdAt : null,
        approvedAt: status === "APPROVED" ? createdAt : null,
        expiresAt: status === "EXPIRED" ? daysAgo(1) : daysAgo(-365),
        status,
        overallResult,
        notes: `KGS sample inspection ${i + 1}`,
        createdAt,
      },
    });

    for (let j = 0; j < checklist.length; j++) {
      const item = await prisma.inspectionItem.create({
        data: {
          inspectionId: inspection.id,
          category: checklist[j][0],
          itemName: checklist[j][1],
          sortOrder: j + 1,
        },
      });
      await prisma.inspectionResultRecord.create({
        data: {
          inspectionId: inspection.id,
          itemId: item.id,
          result: overallResult === "FAIL" && j === 1 ? "DEFECTIVE" : "OK",
          remarks: overallResult === "FAIL" && j === 1 ? "Needs repair" : "Checked",
        },
      });
    }
  }
}

async function seedPayments(companyId, owners, vehicles) {
  const methods = ["EVC", "MERCHANT", "BANK_TRANSFER", "CASH", "CARD"];
  for (let i = 0; i < vehicles.length; i++) {
    const owner = owners[i];
    const vehicle = vehicles[i];
    const amount = 35 + (i % 4) * 5;
    const paid = i % 3 !== 0;
    const invoiceNo = `${SAMPLE_PREFIX}-INV-${String(i + 1).padStart(5, "0")}`;

    const invoice = await prisma.invoice.upsert({
      where: { invoiceNo },
      create: {
        companyId,
        ownerId: owner.id,
        vehicleId: vehicle.id,
        invoiceNo,
        totalAmount: amount,
        paidAmount: paid ? amount : 0,
        currency: "USD",
        dueDate: daysAgo(-14),
        status: paid ? "PAID" : "UNPAID",
        notes: "KGS sample invoice",
      },
      update: {},
    });

    const existingPayment = await prisma.customerPayment.findFirst({ where: { reference: `${SAMPLE_PREFIX}-TXN-${String(i + 1).padStart(5, "0")}` } });
    if (!existingPayment) {
      await prisma.customerPayment.create({
        data: {
          companyId,
          ownerId: owner.id,
          vehicleId: vehicle.id,
          invoiceId: invoice.id,
          amount,
          currency: "USD",
          status: paid ? "PAID" : "UNPAID",
          paymentDate: paid ? daysAgo(i % 30) : null,
          method: paid ? pick(methods, i) : null,
          reference: `${SAMPLE_PREFIX}-TXN-${String(i + 1).padStart(5, "0")}`,
          notes: "KGS sample customer payment",
        },
      });
    }

    if (paid) {
      const existingTransaction = await prisma.paymentTransaction.findFirst({ where: { reference: `${SAMPLE_PREFIX}-TXN-${String(i + 1).padStart(5, "0")}` } });
      if (!existingTransaction) {
        await prisma.paymentTransaction.create({
          data: {
            invoiceId: invoice.id,
            amount,
            currency: "USD",
            method: pick(methods, i),
            reference: `${SAMPLE_PREFIX}-TXN-${String(i + 1).padStart(5, "0")}`,
            paidAt: daysAgo(i % 30),
            notes: "KGS sample transaction",
          },
        });
      }
    }
  }
}

async function seedReportsAndAudit(companyId, userId) {
  const reportTypes = ["INSPECTION_SUMMARY", "PAYMENT_SUMMARY", "VEHICLE_HISTORY", "REVENUE"];
  for (let i = 0; i < reportTypes.length; i++) {
    const title = `KGS ${reportTypes[i].replace(/_/g, " ")} Report`;
    const existing = await prisma.report.findFirst({ where: { companyId, title } });
    if (!existing) {
      await prisma.report.create({
        data: {
          companyId,
          type: reportTypes[i],
          title,
          parameters: { sample: true, month: i + 1 },
        },
      });
    }
  }

  const auditCount = await prisma.auditLog.count({ where: { details: { contains: "KGS sample" } } });
  if (auditCount < 20) {
    for (let i = 0; i < 30; i++) {
      await prisma.auditLog.create({
        data: {
          companyId,
          userId,
          action: pick(["CREATE", "UPDATE", "DELETE", "APPROVE"], i),
          entity: pick(["Vehicle", "Inspection", "CustomerPayment", "Invoice", "Owner"], i),
          entityId: i + 1,
          details: `KGS sample audit log ${i + 1}`,
          ipAddress: "127.0.0.1",
          createdAt: daysAgo(i % 20),
        },
      });
    }
  }
}

async function main() {
  console.log("Starting KGS dashboard seed...");
  const company = await getCompany();
  console.log(`Using company: ${company.name}`);
  const user = await ensureUser(company.id);
  const { models, vehicleColors, registrationFee } = await ensureReferenceData(company.id);
  console.log("Reference data ready");
  const owners = await seedOwners(company.id);
  console.log(`Owners ready: ${owners.length}`);
  const inspectors = await seedInspectors(company.id);
  console.log(`Inspectors ready: ${inspectors.length}`);
  const vehicles = await seedVehicles(company.id, user.id, owners, inspectors, models, vehicleColors, registrationFee);
  console.log(`Vehicles ready: ${vehicles.length}`);
  await seedInspections(company.id, user.id, vehicles, inspectors);
  console.log("Inspections ready");
  await seedPayments(company.id, owners, vehicles);
  console.log("Payments and invoices ready");
  await seedReportsAndAudit(company.id, user.id);

  console.log(`Seed complete for company "${company.name}"`);
  console.log(`Added/verified ${owners.length} owners, ${vehicles.length} vehicles, ${INSPECTION_COUNT} inspections, and payments/invoices.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
