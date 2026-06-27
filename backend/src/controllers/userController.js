import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const { companyId, username, password, email, fullName, role, roleId } = req.body;
    if (!companyId || !username || !password) {
      return res.status(400).json({ error: "companyId, username, and password are required" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: Number(companyId),
        username,
        password: hashed,
        email,
        fullName,
        role,
        roleId: roleId ? Number(roleId) : undefined,
      },
      select: { id: true, username: true, email: true, fullName: true, role: true, roleId: true, companyId: true, createdAt: true },
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
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, company: { select: { id: true, name: true } } },
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
      select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true, company: { select: { id: true, name: true } } },
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
    const { email, fullName, role, isActive, password, roleId } = req.body;
    const data = { email, fullName, role, isActive, roleId: roleId ? Number(roleId) : undefined };
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, username: true, email: true, fullName: true, role: true, roleId: true, isActive: true, updatedAt: true },
    });
    res.json(user);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
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
      { id: user.id, username: user.username, role: user.role, companyId: user.companyId },
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
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

