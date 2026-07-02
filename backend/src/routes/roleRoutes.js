import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateJWT, authorizeFeature("roles"));

router.post("/", createRole);
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
