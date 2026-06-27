import express from "express";
import {
  createInspector,
  getInspectors,
  getInspectorById,
  updateInspector,
  deleteInspector,
} from "../controllers/inspectorController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createInspector);
router.get("/", getInspectors);
router.get("/:id", getInspectorById);
router.put("/:id", updateInspector);
router.delete("/:id", deleteInspector);

export default router;
