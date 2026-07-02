import express from "express";
import {
  createVehicleModel,
  getAllVehicleModels,
  getVehicleModelById,
  updateVehicleModel,
  deleteVehicleModel,
} from "../controllers/vehicleModelController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateJWT, authorizeFeature("models"));

router.post("/", createVehicleModel);
router.get("/", getAllVehicleModels);
router.get("/:id", getVehicleModelById);
router.put("/:id", updateVehicleModel);
router.delete("/:id", deleteVehicleModel);

export default router;
