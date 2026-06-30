import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { companyWhere } from "../lib/tenant.js";

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const { companyId, username, password, email, fullName, role, roleId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId || 1;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: Number(targetCompanyId),
        username,
        password: hashed,
        email,
        fullName,
        role,
        roleId: roleId ? Number(roleId) : undefined,
      },
      select: { id: true, username: true, email: true, fullName: true, avatarUrl: true, role: true, roleId: true, companyId: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Username or email already exists" });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const scope = companyWhere(req, req.query.companyId);
    const users = await prisma.user.findMany({
      where: scope,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { username, email, fullName, avatarUrl, role, isActive, password, roleId } = req.body;
    const data = {};
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;
    if (fullName !== undefined) data.fullName = fullName;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (roleId !== undefined) data.roleId = roleId === "" || roleId === null ? null : Number(roleId);
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        roleId: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(user);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users/:id/avatar
export const uploadUserAvatar = async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    if (req.user?.role !== "SUPER_ADMIN" && Number(req.user?.id) !== targetUserId) {
      return res.status(403).json({ error: "You can only update your own avatar" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Avatar image is required" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        roleId: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true } },
      },
    });
    res.json(user);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
    console.error("Upload avatar error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users/me/change-password
export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, password: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { company: { select: { id: true, name: true } } },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const secret = process.env.JWT_SECRET || "supersecretkey";
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, companyId: user.companyId, roleId: user.roleId },
      secret,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        roleId: user.roleId,
        companyId: user.companyId,
        companyName: user.company?.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

