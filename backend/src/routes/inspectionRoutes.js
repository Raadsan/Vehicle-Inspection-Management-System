import express from "express";
import {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
} from "../controllers/inspectionController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createInspection);
router.get("/", getInspections);
router.get("/:id", getInspectionById);
router.put("/:id", updateInspection);
router.delete("/:id", deleteInspection);

export default router;
