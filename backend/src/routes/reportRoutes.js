import express from "express";
import {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
} from "../controllers/reportController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticateJWT, authorizeFeature("reports"));

// Create a new report
router.post("/", createReport);

// Get all reports (optional companyId query param)
router.get("/", getAllReports);

// Get a single report by ID
router.get("/:id", getReportById);

// Update a report by ID
router.put("/:id", updateReport);

// Delete a report by ID
router.delete("/:id", deleteReport);

export default router;
