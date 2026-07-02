import express from "express";
import { getAllItems, createItem, updateItem, deleteItem } from "../controllers/inspectionTemplateItemController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticateJWT, authorizeFeature("inspection-items"));

router.get("/", getAllItems);
router.post("/", createItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
