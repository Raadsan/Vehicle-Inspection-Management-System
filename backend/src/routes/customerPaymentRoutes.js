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
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateJWT, authorizeFeature("customer-payments"));

router.get("/", getAllCustomerPayments);
router.post("/sync-all", syncAllCustomerPayments);
router.post("/sync/:vehicleId", syncCustomerPaymentForVehicle);
router.get("/:id", getCustomerPaymentById);
router.put("/:id", updateCustomerPayment);
router.post("/:id/paid", approveCustomerPaymentPaid);

export default router;
