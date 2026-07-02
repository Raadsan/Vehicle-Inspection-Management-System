import express from "express";
import { getAllInvoices, getInvoiceById } from "../controllers/invoiceController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateJWT, authorizeFeature("invoices"));

router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);

export default router;
