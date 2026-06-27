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

router.post("/", createCompany); // Allow company registration to be public or protected depending on design, let's keep it public for new signups or protected. Let's make it public so anyone can register their company.
router.get("/", authenticateJWT, getAllCompanies);
router.get("/:id", authenticateJWT, getCompanyById);
router.put("/:id", authenticateJWT, updateCompany);
router.delete("/:id", authenticateJWT, deleteCompany);

export default router;
