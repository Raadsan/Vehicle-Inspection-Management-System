import express from "express";
import {
  getRolePermissions,
  setRolePermissions,
} from "../controllers/rolePermissionController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateJWT, authorizeFeature("role-permissions"));

router.get("/:roleId", getRolePermissions);
router.put("/:roleId", setRolePermissions);

export default router;
