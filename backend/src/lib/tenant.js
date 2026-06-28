/** Multi-tenant helpers — SUPER_ADMIN sees all; others scoped to JWT companyId */

export function isSuperAdmin(req) {
  return req.user?.role === "SUPER_ADMIN";
}

export function resolveCompanyId(req, bodyCompanyId) {
  if (isSuperAdmin(req)) {
    if (bodyCompanyId) return Number(bodyCompanyId);
    return req.user?.companyId ? Number(req.user.companyId) : 1;
  }
  if (req.user?.companyId) return Number(req.user.companyId);
  return bodyCompanyId ? Number(bodyCompanyId) : 1;
}

export function companyWhere(req, queryCompanyId) {
  if (isSuperAdmin(req)) {
    return queryCompanyId ? { companyId: Number(queryCompanyId) } : {};
  }
  if (req.user?.companyId) {
    return { companyId: Number(req.user.companyId) };
  }
  return {};
}
