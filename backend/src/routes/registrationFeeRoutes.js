import express from "express";
import {
  getAllRegistrationFees,
  getRegistrationFeeById,
  createRegistrationFee,
  updateRegistrationFee,
  deleteRegistrationFee,
} from "../controllers/registrationFeeController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticateJWT, authorizeFeature("registration-fees"));

router.get("/", getAllRegistrationFees);
router.get("/:id", getRegistrationFeeById);
router.post("/", createRegistrationFee);
router.put("/:id", updateRegistrationFee);
router.delete("/:id", deleteRegistrationFee);

export default router;
