import { prisma } from "../src/lib/prisma.js";

function deriveSystemRole(roleName) {
  const normalized = String(roleName || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (["superadmin", "owner"].includes(normalized)) return "SUPER_ADMIN";
  if (normalized.includes("inspector")) return "INSPECTOR";
  return "STAFF";
}

async function main() {
  const users = await prisma.user.findMany({
    where: { roleId: { not: null } },
    include: { customRole: { select: { name: true } } },
  });

  let updated = 0;
  for (const user of users) {
    const role = deriveSystemRole(user.customRole?.name);
    if (user.role !== role) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });
      updated += 1;
    }
  }

  console.log(`Synced ${updated} users from database roles.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
