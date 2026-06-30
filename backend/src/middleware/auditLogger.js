import { writeAuditLog } from "../lib/auditLog.js";

const ENTITY_LABELS = {
  "companies": "Company",
  "users": "User",
  "vehicle-brands": "VehicleBrand",
  "vehicle-models": "VehicleModel",
  "vehicle-colors": "VehicleColor",
  "owners": "Owner",
  "vehicles": "Vehicle",
  "vehicle-owners": "VehicleOwner",
  "inspectors": "Inspector",
  "payments": "Payment",
  "roles": "Role",
  "permissions": "Permission",
  "role-permissions": "RolePermission",
  "inspections": "Inspection",
  "inspection-template-items": "InspectionTemplateItem",
  "registration-fees": "RegistrationFee",
  "customer-payments": "CustomerPayment",
  "invoices": "Invoice",
};

function actionFromMethod(method) {
  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";
  return null;
}

function pathParts(req) {
  return req.path.split("/").filter(Boolean);
}

function entityFromPath(req) {
  const [, resource] = pathParts(req);
  return ENTITY_LABELS[resource] || resource;
}

function entityIdFromRequest(req, responseBody) {
  const parts = pathParts(req);
  const pathId = parts.find((part, index) => index > 1 && /^\d+$/.test(part));
  return pathId || responseBody?.id || responseBody?.data?.id;
}

function shouldAudit(req) {
  if (!req.path.startsWith("/api/")) return false;
  if (req.path.startsWith("/api/audit-logs")) return false;
  if (req.path === "/api/users/login") return false;
  return !!actionFromMethod(req.method);
}

function detailsFromRequest(req, action, entity) {
  const parts = pathParts(req);
  const subAction = parts.slice(3).join(" ");
  const name = req.body?.name || req.body?.username || req.body?.fullName || req.body?.plateNumber || req.body?.title;
  const suffix = subAction ? ` (${subAction})` : "";
  return `${action.charAt(0)}${action.slice(1).toLowerCase()} ${entity}${name ? ` "${name}"` : ""}${suffix}`;
}

export function auditLogger(req, res, next) {
  if (!shouldAudit(req)) return next();

  let responseBody;
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", async () => {
    if (res.statusCode >= 400) return;

    const action = actionFromMethod(req.method);
    const entity = entityFromPath(req);
    if (!action || !entity) return;

    await writeAuditLog({
      companyId: req.user?.companyId || req.body?.companyId || responseBody?.companyId,
      userId: req.user?.id,
      action,
      entity,
      entityId: entityIdFromRequest(req, responseBody),
      details: detailsFromRequest(req, action, entity),
      ipAddress: req.ip,
    });
  });

  next();
}
