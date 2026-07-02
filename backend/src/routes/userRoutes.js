import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  changeMyPassword,
  uploadUserAvatar,
  deleteUser,
  getUserPermissions,
  loginUser,
} from "../controllers/userController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { allowSelfOrFeature, authorizeFeature } from "../middleware/authorize.js";

const router = express.Router();

const avatarDir = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Public route for login
router.post("/login", loginUser);

// Protected user CRUD routes
router.post("/", authenticateJWT, authorizeFeature("users", "create"), createUser);
router.get("/", authenticateJWT, authorizeFeature("users", "view"), getAllUsers);
router.post("/me/change-password", authenticateJWT, changeMyPassword);
router.get("/me/permissions", authenticateJWT, getUserPermissions);
router.post("/:id/avatar", authenticateJWT, allowSelfOrFeature("users", "edit"), upload.single("avatar"), uploadUserAvatar);
router.get("/:id/permissions", authenticateJWT, allowSelfOrFeature("users", "view"), getUserPermissions);
router.get("/:id", authenticateJWT, allowSelfOrFeature("users", "view"), getUserById);
router.put("/:id", authenticateJWT, allowSelfOrFeature("users", "edit"), updateUser);
router.delete("/:id", authenticateJWT, authorizeFeature("users", "delete"), deleteUser);

export default router;
