import { prisma } from "../lib/prisma.js";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "OWNER"]);

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[\s/_-]+/g, "");
}

function actionFromMethod(method) {
  if (method === "GET") return "view";
  if (method === "POST") return "create";
  if (method === "PUT" || method === "PATCH") return "edit";
  if (method === "DELETE") return "delete";
  return "view";
}

function actionFromRequest(req) {
  if (
    req.method === "POST" &&
    /\/(approve|reject|complete|paid|sync|sync-all|avatar|change-password)(\/|$)/.test(req.path)
  ) {
    return "edit";
  }
  return actionFromMethod(req.method);
}

function actionAliases(action) {
  if (action === "create") return ["create", "add", "manage"];
  if (action === "edit") return ["edit", "update", "manage"];
  if (action === "delete") return ["delete", "remove", "manage"];
  return ["view", "manage"];
}

function isAdmin(user) {
  return ADMIN_ROLES.has(String(user?.role || "").toUpperCase());
}

async function roleHasPermission(roleId, feature, action) {
  if (!roleId) return false;

  const rows = await prisma.rolePermission.findMany({
    where: { roleId: Number(roleId) },
    include: { permission: true },
  });
  const featureKey = normalize(feature);
  const actions = actionAliases(action).map(normalize);

  return rows.some(({ permission }) => {
    const code = normalize(permission?.code);
    const permissionFeature = normalize(permission?.feature);
    const permissionAction = normalize(permission?.action);

    return (
      (permissionFeature === featureKey || code.startsWith(`${featureKey}.`)) &&
      actions.some((allowedAction) => permissionAction === allowedAction || code.endsWith(`.${allowedAction}`))
    );
  });
}

export function authorizeFeature(feature, actionOverride) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      if (isAdmin(req.user)) return next();

      const action = actionOverride || actionFromRequest(req);
      const allowed = await roleHasPermission(req.user.roleId, feature, action);
      if (!allowed) {
        return res.status(403).json({
          error: "You do not have permission to perform this action.",
          feature,
          action,
        });
      }

      next();
    } catch (err) {
      console.error("Authorization error:", err);
      res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
}

export function allowSelfOrFeature(feature, actionOverride) {
  const authorize = authorizeFeature(feature, actionOverride);
  return async (req, res, next) => {
    if (req.user && String(req.user.id) === String(req.params.id)) return next();
    return authorize(req, res, next);
  };
}
