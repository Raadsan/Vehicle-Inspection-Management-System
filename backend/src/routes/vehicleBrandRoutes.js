import express from "express";
import {
  createVehicleBrand,
  getAllVehicleBrands,
  getVehicleBrandById,
  updateVehicleBrand,
  deleteVehicleBrand,
} from "../controllers/vehicleBrandController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createVehicleBrand);
router.get("/", getAllVehicleBrands);
router.get("/:id", getVehicleBrandById);
router.put("/:id", updateVehicleBrand);
router.delete("/:id", deleteVehicleBrand);

export default router;
