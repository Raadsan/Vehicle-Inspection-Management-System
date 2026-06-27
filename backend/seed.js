import { prisma } from "./src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  // Clean up previous data
  await prisma.report.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customerPayment.deleteMany();
  await prisma.inspectorPayment.deleteMany();
  await prisma.inspectionResultRecord.deleteMany();
  await prisma.inspectionItem.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.vehicleInspector.deleteMany();
  await prisma.vehicleOwner.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.vehicleBrand.deleteMany();
  await prisma.inspector.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Companies
  const company = await prisma.company.create({
    data: {
      name: "Acme Inspection Co",
      email: "info@acme.com",
      phone: "1234567890",
      address: "123 Main St",
      logo: "https://via.placeholder.com/150",
    },
  });

  // 2. Owner User (auto‑created when company is created in real API)
  const ownerPassword = await bcrypt.hash("ownerPass123", 10);
  const ownerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: "acme_owner",
      password: ownerPassword,
      role: "OWNER",
    },
  });

// 3. Custom Role for admin
const adminRole = await prisma.role.create({
  data: {
    companyId: company.id,
    name: "UserAdmin",
    description: "Admin user for company",
    isActive: true,
  },
});

const adminPassword = await bcrypt.hash("adminPass123", 10);
const adminUser = await prisma.user.create({
  data: {
    companyId: company.id,
    username: "acme_admin",
    password: adminPassword,
    email: "admin@acme.com",
    fullName: "Admin User",
    role: "SUPER_ADMIN",
    roleId: adminRole.id,
  },
  select: { id: true, username: true },
});

  // 3. Vehicle Brands & 4. Models
  const toyota = await prisma.vehicleBrand.create({
    data: { name: "Toyota" },
  });
  const camry = await prisma.vehicleModel.create({
    data: { brandId: toyota.id, name: "Camry", year: 2022 },
  });

  const honda = await prisma.vehicleBrand.create({
    data: { name: "Honda" },
  });
  const civic = await prisma.vehicleModel.create({
    data: { brandId: honda.id, name: "Civic", year: 2021 },
  });

  // 5. Owners (customers)
  const owner1 = await prisma.owner.create({
    data: {
      companyId: company.id,
      fullName: "John Doe",
      phone: "555-1111",
      email: "john@example.com",
      address: "456 Oak Ave",
      idNumber: "ID123456",
    },
  });

  // 6. Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      modelId: camry.id,
      plateNumber: "ABC-1234",
      color: "White",
      year: 2022,
      vin: "VINCAMRY123456",
      mileage: 12000,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      modelId: civic.id,
      plateNumber: "XYZ-5678",
      color: "Black",
      year: 2021,
      vin: "VINCIVIC654321",
      mileage: 8000,
    },
  });

  // 7. Vehicle_Owners (many‑to‑many)
  await prisma.vehicleOwner.create({ data: { vehicleId: vehicle1.id, ownerId: owner1.id } });
  await prisma.vehicleOwner.create({ data: { vehicleId: vehicle2.id, ownerId: owner1.id } });

  // 8. Inspectors
  const inspector = await prisma.inspector.create({
    data: {
      companyId: company.id,
      name: "Alice Inspector",
      email: "alice@acme.com",
      phone: "555-2222",
    },
  });

  // 9. Vehicle_Inspectors (assign inspector to vehicles)
  await prisma.vehicleInspector.create({ data: { vehicleId: vehicle1.id, inspectorId: inspector.id } });

  // 10. Inspections
  const inspection = await prisma.inspection.create({
    data: {
      companyId: company.id,
      vehicleId: vehicle1.id,
      inspectorId: inspector.id,
      status: "COMPLETED",
      scheduledAt: new Date(),
    },
  });

  // 11. Inspection_Items
  const item1 = await prisma.inspectionItem.create({
    data: { inspectionId: inspection.id, name: "Brakes", description: "Check brake pads" },
  });
  const item2 = await prisma.inspectionItem.create({
    data: { inspectionId: inspection.id, name: "Lights", description: "Check all lights" },
  });

  // 12. Inspection_Results
  await prisma.inspectionResultRecord.create({
    data: {
      inspectionId: inspection.id,
      itemId: item1.id,
      result: "OK",
      remarks: "All good",
    },
  });
  await prisma.inspectionResultRecord.create({
    data: {
      inspectionId: inspection.id,
      itemId: item2.id,
      result: "DEFECTIVE",
      remarks: "Rear light out",
    },
  });

  // 13. Inspector_Payments
  await prisma.inspectorPayment.create({
    data: {
      companyId: company.id,
      inspectorId: inspector.id,
      amount: 150.0,
      currency: "USD",
      method: "CASH",
    },
  });

  // 14. Customer_Payments
  await prisma.customerPayment.create({
    data: {
      companyId: company.id,
      ownerId: owner1.id,
      amount: 300.0,
      currency: "USD",
      method: "CREDIT_CARD",
    },
  });

  // 15. Invoices
  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      ownerId: owner1.id,
      totalAmount: 300.0,
      status: "PAID",
    },
  });

  // 16. Payment_Transactions
  await prisma.paymentTransaction.create({
    data: {
      invoiceId: invoice.id,
      amount: 300.0,
      method: "CREDIT_CARD",
      status: "SUCCESS",
    },
  });

  // 17. Reports
  await prisma.report.create({
    data: {
      companyId: company.id,
      name: "Monthly Inspection Summary",
      generatedAt: new Date(),
      parameters: JSON.stringify({ month: "2024-09" }),
    },
  });

  console.log("✅ Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
