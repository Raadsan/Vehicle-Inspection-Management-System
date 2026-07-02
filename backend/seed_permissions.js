import { prisma } from "./src/lib/prisma.js";

const features = [
  ["dashboard", "Dashboard"],
  ["users", "Users"],
  ["companies", "Companies"],
  ["owners", "Vehicle Owners"],
  ["vehicles", "Vehicles"],
  ["brands", "Brands"],
  ["models", "Models"],
  ["colors", "Colors"],
  ["registration-fees", "Registration Fees"],
  ["inspectors", "Inspectors"],
  ["inspections", "Inspections"],
  ["inspection-items", "Inspection Items"],
  ["customer-payments", "Customer Payments"],
  ["payments", "Payments"],
  ["invoices", "Invoices"],
  ["reports", "Reports"],
  ["roles", "Roles"],
  ["permissions", "Permissions"],
  ["role-permissions", "Role Permissions"],
  ["audit-log", "Audit Log"],
];

const actions = ["view", "create", "edit", "delete", "manage"];

const defaultPermissions = features.flatMap(([feature, label]) =>
  actions.map((action) => ({
    code: `${feature}.${action}`,
    feature,
    action,
    description: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${label}`,
  }))
);

async function seed() {
  for (const perm of defaultPermissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
  }
  console.log(`✅ Seeded ${defaultPermissions.length} permissions`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
