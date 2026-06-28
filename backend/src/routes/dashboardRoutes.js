import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateJWT);
router.get("/stats", getDashboardStats);

export default router;
