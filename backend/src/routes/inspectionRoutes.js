import express from "express";
import {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  approveInspection,
  rejectInspection,
  completeInspection,
  verifyVehicleInspection,
} from "../controllers/inspectionController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.get("/verify", verifyVehicleInspection);

router.use(authenticateJWT, authorizeFeature("inspections"));

router.post("/", createInspection);
router.get("/", getInspections);
router.get("/:id", getInspectionById);
router.put("/:id", updateInspection);
router.delete("/:id", deleteInspection);

// Approval workflow endpoints
router.post("/:id/complete", completeInspection);
router.post("/:id/approve", approveInspection);
router.post("/:id/reject", rejectInspection);

export default router;
