import express from "express";
import {
  createOwner,
  getAllOwners,
  getOwnerById,
  updateOwner,
  deleteOwner,
} from "../controllers/ownerController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateJWT, authorizeFeature("owners"));

router.post("/", createOwner);
router.get("/", getAllOwners);
router.get("/:id", getOwnerById);
router.put("/:id", updateOwner);
router.delete("/:id", deleteOwner);

export default router;
