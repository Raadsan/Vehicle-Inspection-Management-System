import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const adapter = new PrismaMariaDb(databaseUrl);

export const prisma = new PrismaClient({ adapter });
