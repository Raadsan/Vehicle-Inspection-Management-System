import { prisma } from "./src/lib/prisma.js";
try {
  const users = await prisma.user.findMany({
    take: 5
  });
  console.log("SUCCESS:", users.length, "users found");
  console.log(users.map(u => ({ username: u.username, email: u.email })));
} catch (e) {
  console.error("ERROR:", e);
} finally {
  await prisma.$disconnect();
}
