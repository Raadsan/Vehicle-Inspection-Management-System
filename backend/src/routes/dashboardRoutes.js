import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticateJWT, authorizeFeature("dashboard"));
router.get("/stats", getDashboardStats);

export default router;
