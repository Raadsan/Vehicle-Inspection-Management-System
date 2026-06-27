import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
} from "../controllers/userController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Public route for login
router.post("/login", loginUser);

// Protected user CRUD routes
router.post("/", authenticateJWT, createUser);
router.get("/", authenticateJWT, getAllUsers);
router.get("/:id", authenticateJWT, getUserById);
router.put("/:id", authenticateJWT, updateUser);
router.delete("/:id", authenticateJWT, deleteUser);

export default router;
