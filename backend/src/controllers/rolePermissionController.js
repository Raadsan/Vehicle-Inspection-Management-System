import { prisma } from "../lib/prisma.js";

export const getRolePermissions = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: "Role not found" });

    const assignments = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
      orderBy: { permission: { feature: "asc" } },
    });
    res.json(assignments);
  } catch (err) {
    console.error("Get role permissions error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const setRolePermissions = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: "permissionIds array is required" });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: "Role not found" });

    const ids = permissionIds.map(Number);

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(ids.length
        ? [
            prisma.rolePermission.createMany({
              data: ids.map((permissionId) => ({ roleId, permissionId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    const assignments = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    res.json(assignments);
  } catch (err) {
    console.error("Set role permissions error:", err);
    res.status(500).json({ error: err.message });
  }
};
