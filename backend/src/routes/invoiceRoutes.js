import express from "express";
import { getAllInvoices, getInvoiceById } from "../controllers/invoiceController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);

export default router;
