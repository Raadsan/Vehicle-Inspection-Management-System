import { prisma } from "./src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function createUser() {
  try {
    // Get or create a company first
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Inspection Cars Co",
          email: "info@inspectioncars.com",
          phone: "1234567890",
          address: "123 Main St",
        },
      });
      console.log("✅ Company created:", company.name);
    } else {
      console.log("✅ Using existing company:", company.name);
    }

    // Get or create SUPER_ADMIN role
    let adminRole = await prisma.role.findFirst({
      where: { companyId: company.id, name: "SuperAdmin" },
    });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          companyId: company.id,
          name: "SuperAdmin",
          description: "Super Administrator",
          isActive: true,
        },
      });
      console.log("✅ Role created:", adminRole.name);
    }

    // Create SUPER_ADMIN user
    const existingAdmin = await prisma.user.findFirst({
      where: { username: "admin" },
    });
    if (existingAdmin) {
      console.log("⚠️  User 'admin' already exists. Skipping.");
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminUser = await prisma.user.create({
        data: {
          companyId: company.id,
          username: "admin",
          password: hashedPassword,
          email: "admin@inspectioncars.com",
          fullName: "Super Admin",
          role: "SUPER_ADMIN",
          roleId: adminRole.id,
        },
      });
      console.log("✅ User created:");
      console.log("   Username:", adminUser.username);
      console.log("   Password: admin123");
      console.log("   Role:    ", adminUser.role);
    }

    // Create regular user
    const existingUser = await prisma.user.findFirst({
      where: { username: "user" },
    });
    if (existingUser) {
      console.log("⚠️  User 'user' already exists. Skipping.");
    } else {
      const hashedPassword = await bcrypt.hash("user123", 10);
      const regularUser = await prisma.user.create({
        data: {
          companyId: company.id,
          username: "user",
          password: hashedPassword,
          email: "user@inspectioncars.com",
          fullName: "Regular User",
          role: "OWNER",
        },
      });
      console.log("✅ User created:");
      console.log("   Username:", regularUser.username);
      console.log("   Password: user123");
      console.log("   Role:    ", regularUser.role);
    }

    // List all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, role: true, email: true },
    });
    console.log("\n📋 All users in database:");
    console.table(allUsers);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
