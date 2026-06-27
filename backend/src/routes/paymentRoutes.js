import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createPayment);
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
