import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateJWT, createCompany);
router.get("/", authenticateJWT, getAllCompanies);
router.get("/:id", authenticateJWT, getCompanyById);
router.put("/:id", authenticateJWT, updateCompany);
router.delete("/:id", authenticateJWT, deleteCompany);

export default router;
