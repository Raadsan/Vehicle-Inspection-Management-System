import express from "express";
import { getAllItems, createItem, updateItem, deleteItem } from "../controllers/inspectionTemplateItemController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateJWT);

router.get("/", getAllItems);
router.post("/", createItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
