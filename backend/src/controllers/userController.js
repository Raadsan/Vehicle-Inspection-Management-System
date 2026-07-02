import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { companyWhere } from "../lib/tenant.js";

function deriveSystemRoleFromRoleName(roleName) {
  const normalized = String(roleName || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (["superadmin", "owner"].includes(normalized)) return "SUPER_ADMIN";
  if (normalized.includes("inspector")) return "INSPECTOR";
  return "STAFF";
}

async function resolveRoleData(roleId, fallbackRole = "STAFF") {
  if (!roleId) return { role: fallbackRole, roleId: undefined };
  const customRole = await prisma.role.findUnique({
    where: { id: Number(roleId) },
    select: { id: true, name: true },
  });
  if (!customRole) {
    const error = new Error("Role not found");
    error.status = 404;
    throw error;
  }
  return { role: deriveSystemRoleFromRoleName(customRole.name), roleId: customRole.id };
}

const userSelect = {
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
  customRole: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
};

function toPublicUser(user) {
  if (!user) return user;
  const { customRole, ...rest } = user;
  return {
    ...rest,
    role: customRole?.name || user.role,
  };
}

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const { companyId, username, password, email, fullName, roleId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId || 1;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }
    const roleData = await resolveRoleData(roleId);
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: Number(targetCompanyId),
        username,
        password: hashed,
        email,
        fullName,
        role: roleData.role,
        roleId: roleData.roleId,
      },
      select: userSelect,
    });
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
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
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map(toPublicUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: userSelect,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(toPublicUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { username, email, fullName, avatarUrl, isActive, password, roleId } = req.body;
    const data = {};
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;
    if (fullName !== undefined) data.fullName = fullName;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (isActive !== undefined) data.isActive = isActive;
    if (roleId !== undefined) {
      if (roleId === "" || roleId === null) {
        data.roleId = null;
        data.role = "STAFF";
      } else {
        const roleData = await resolveRoleData(roleId);
        data.roleId = roleData.roleId;
        data.role = roleData.role;
      }
    }
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: userSelect,
    });
    res.json(toPublicUser(user));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
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
      select: userSelect,
    });
    res.json(toPublicUser(user));
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

// GET /api/users/:id/permissions
export const getUserPermissions = async (req, res) => {
  try {
    const targetUserId = req.params.id === "me" ? Number(req.user.id) : Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        roleId: true,
        customRole: { select: { id: true, name: true } },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const assignments = user.roleId
      ? await prisma.rolePermission.findMany({
          where: { roleId: user.roleId },
          include: { permission: true },
          orderBy: [
            { permission: { feature: "asc" } },
            { permission: { action: "asc" } },
          ],
        })
      : [];

    const permissions = assignments.map(({ permission }) => ({
      id: permission.id,
      code: permission.code,
      feature: permission.feature,
      action: permission.action,
      description: permission.description,
    }));

    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.feature]) acc[permission.feature] = {};
      acc[permission.feature][permission.action] = true;
      return acc;
    }, {});

    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.customRole?.name || user.role,
        roleId: user.roleId,
      },
      permissions,
      groupedPermissions,
      totalPermissions: permissions.length,
    });
  } catch (err) {
    console.error("Get user permissions error:", err);
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
      include: {
        company: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true } },
      },
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
        role: user.customRole?.name || user.role,
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

