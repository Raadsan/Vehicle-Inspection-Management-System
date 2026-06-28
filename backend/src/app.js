import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

// Import routers
import dashboardRouter from "./routes/dashboardRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import companyRouter from "./routes/companyRoutes.js";
import userRouter from "./routes/userRoutes.js";
import vehicleBrandRouter from "./routes/vehicleBrandRoutes.js";
import vehicleModelRouter from "./routes/vehicleModelRoutes.js";
import vehicleColorRouter from "./routes/vehicleColorRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import vehicleRouter from "./routes/vehicleRoutes.js";
import vehicleOwnerRouter from "./routes/vehicleOwnerRoutes.js";
import inspectorRouter from "./routes/inspectorRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import roleRouter from "./routes/roleRoutes.js";
import permissionRouter from "./routes/permissionRoutes.js";
import rolePermissionRouter from "./routes/rolePermissionRoutes.js";
import auditLogRouter from "./routes/auditLogRoutes.js";
import inspectionRouter from "./routes/inspectionRoutes.js";
import inspectionTemplateItemRouter from "./routes/inspectionTemplateItemRoutes.js";
import registrationFeeRouter from "./routes/registrationFeeRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check – verifies DB connectivity
app.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.send("Database connection successful!");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    res.status(500).send("Database connection failed");
  }
});

// Register all API routers
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportRouter);
app.use('/api/companies', companyRouter);
app.use('/api/users', userRouter);
app.use('/api/vehicle-brands', vehicleBrandRouter);
app.use('/api/vehicle-models', vehicleModelRouter);
app.use('/api/vehicle-colors', vehicleColorRouter);
app.use('/api/owners', ownerRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/vehicle-owners', vehicleOwnerRouter);
app.use('/api/inspectors', inspectorRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/roles', roleRouter);
app.use('/api/permissions', permissionRouter);
app.use('/api/role-permissions', rolePermissionRouter);
app.use('/api/audit-logs', auditLogRouter);
app.use('/api/inspections', inspectionRouter);
app.use('/api/inspection-template-items', inspectionTemplateItemRouter);
app.use('/api/registration-fees', registrationFeeRouter);

export default app;
