import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const adapter = new PrismaMariaDb(databaseUrl);

export const prisma = new PrismaClient({ adapter });

if (!prisma.vehicleColor) {
  throw new Error(
    "Prisma client is out of date (missing VehicleColor). Run `npm run db:generate` in backend, then restart the server."
  );
}
