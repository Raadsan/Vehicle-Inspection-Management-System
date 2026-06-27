import express from "express";
import {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/permissionController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createPermission);
router.get("/", getAllPermissions);
router.get("/:id", getPermissionById);
router.put("/:id", updatePermission);
router.delete("/:id", deletePermission);

export default router;
