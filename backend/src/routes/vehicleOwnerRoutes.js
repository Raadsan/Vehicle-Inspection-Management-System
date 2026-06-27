import express from "express";
import {
  createVehicleOwner,
  getAllVehicleOwners,
  getVehicleOwnerById,
  updateVehicleOwner,
  deleteVehicleOwner,
} from "../controllers/vehicleOwnerController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createVehicleOwner);
router.get("/", getAllVehicleOwners);
router.get("/:id", getVehicleOwnerById);
router.put("/:id", updateVehicleOwner);
router.delete("/:id", deleteVehicleOwner);

export default router;
