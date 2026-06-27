import express from "express";
import {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogById,
} from "../controllers/auditLogController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createAuditLog);
router.get("/", getAllAuditLogs);
router.get("/:id", getAuditLogById);

export default router;
