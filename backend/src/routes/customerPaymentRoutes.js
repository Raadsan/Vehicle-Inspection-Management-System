import express from "express";
import {
  getAllCustomerPayments,
  getCustomerPaymentById,
  updateCustomerPayment,
  approveCustomerPaymentPaid,
  syncCustomerPaymentForVehicle,
  syncAllCustomerPayments,
} from "../controllers/customerPaymentController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.get("/", getAllCustomerPayments);
router.post("/sync-all", syncAllCustomerPayments);
router.post("/sync/:vehicleId", syncCustomerPaymentForVehicle);
router.get("/:id", getCustomerPaymentById);
router.put("/:id", updateCustomerPayment);
router.post("/:id/paid", approveCustomerPaymentPaid);

export default router;
