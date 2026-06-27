import express from "express";
import {
  getRolePermissions,
  setRolePermissions,
} from "../controllers/rolePermissionController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.get("/:roleId", getRolePermissions);
router.put("/:roleId", setRolePermissions);

export default router;
