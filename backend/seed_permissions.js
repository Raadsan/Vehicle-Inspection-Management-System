import { prisma } from "./src/lib/prisma.js";

const defaultPermissions = [
  { code: "users.view", feature: "Users", action: "View", description: "View users list" },
  { code: "users.create", feature: "Users", action: "Create", description: "Create new users" },
  { code: "users.edit", feature: "Users", action: "Edit", description: "Edit existing users" },
  { code: "users.delete", feature: "Users", action: "Delete", description: "Delete users" },
  { code: "roles.view", feature: "Roles", action: "View", description: "View roles" },
  { code: "roles.manage", feature: "Roles", action: "Manage", description: "Create and edit roles" },
  { code: "vehicles.view", feature: "Vehicles", action: "View", description: "View vehicles" },
  { code: "vehicles.manage", feature: "Vehicles", action: "Manage", description: "Manage vehicles" },
  { code: "inspections.view", feature: "Inspections", action: "View", description: "View inspections" },
  { code: "inspections.manage", feature: "Inspections", action: "Manage", description: "Manage inspections" },
  { code: "audit.view", feature: "Audit", action: "View", description: "View audit logs" },
  { code: "config.manage", feature: "Configuration", action: "Manage", description: "Manage system configuration" },
];

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
