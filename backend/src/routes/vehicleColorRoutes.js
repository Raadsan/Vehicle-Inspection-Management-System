import express from "express";
import {
  createVehicleColor,
  getAllVehicleColors,
  getVehicleColorById,
  updateVehicleColor,
  deleteVehicleColor,
} from "../controllers/vehicleColorController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createVehicleColor);
router.get("/", getAllVehicleColors);
router.get("/:id", getVehicleColorById);
router.put("/:id", updateVehicleColor);
router.delete("/:id", deleteVehicleColor);

export default router;
