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
} from "../controllers/inspectionController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

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
