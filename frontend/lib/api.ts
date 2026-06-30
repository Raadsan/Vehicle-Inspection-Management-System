import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: "/api",
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  companyId: number;
  username: string;
  password?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  role: "SUPER_ADMIN" | "OWNER" | "INSPECTOR" | "STAFF";
  roleId?: number;
  isActive: boolean;
  createdAt: string;
  customRole?: Role;
  company?: { id: number; name: string };
  companyName?: string;
}

export interface Role {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  company?: { id: number; name: string };
  _count?: { users: number };
}

export interface Permission {
  id: number;
  code: string;
  feature: string;
  action: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt?: string;
  permission?: Permission;
}

export interface AuditLog {
  id: number;
  companyId?: number;
  userId?: number;
  action: string;
  entity?: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { id: number; username: string; fullName?: string };
  company?: { id: number; name: string };
}

export interface Company {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
  users?: Array<{ id: number; username: string; role: string; email?: string }>;
  _count?: { vehicles: number; inspectors: number; inspections: number };
}

export interface Owner {
  id: number;
  companyId: number;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
}

export interface VehicleColor {
  id: number;
  name: string;
  createdAt?: string;
  _count?: { vehicles: number };
}

export interface Vehicle {
  id: number;
  companyId: number;
  ownerId?: number;
  modelId?: number;
  colorId?: number;
  plateNumber: string;
  color?: string;
  year?: number;
  vin?: string;
  mileage?: number;
  logbookNumber?: string;
  status: "ACTIVE" | "INACTIVE" | "SCRAPPED" | "UNDER_INSPECTION" | "BANNED";
  registrationFeeId?: number;
  createdByUserId?: number;
  model?: VehicleModel;
  vehicleColor?: VehicleColor;
  owner?: Owner;
  registrationFee?: RegistrationFee;
}

export interface VehicleBrand {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: number;
  brandId: number;
  name: string;
  year?: number;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  brand?: VehicleBrand;
}

export interface Inspector {
  id: number;
  companyId: number;
  fullName: string;
  phone?: string;
  email?: string;
  licenseNo?: string;
  isActive: boolean;
  company?: { id: number; name: string };
}

export interface InspectionItemResult {
  id: number;
  inspectionId: number;
  itemId: number;
  result: "OK" | "DEFECTIVE" | "NEEDS_ATTENTION" | "NOT_APPLICABLE";
  remarks?: string;
  photoUrl?: string;
}

export interface InspectionChecklistItem {
  id: number;
  inspectionId: number;
  category: string;
  itemName: string;
  isRequired: boolean;
  sortOrder: number;
  inspectionResults?: InspectionItemResult[];
}

export interface Inspection {
  id: number;
  companyId: number;
  vehicleId: number;
  inspectorId?: number | null;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "AWAITING_APPROVAL" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  notes?: string;
  overallResult?: "PASS" | "FAIL" | "CONDITIONAL";
  approvedAt?: string;
  expiresAt?: string;
  vehicle?: Vehicle;
  inspector?: Inspector;
  company?: { id: number; name: string };
  inspectionItems?: InspectionChecklistItem[];
  createdAt?: string;
  createdByUserId?: number;
  createdByUser?: {
    id: number;
    fullName?: string | null;
    username: string;
    role: string;
    company?: { id: number; name: string };
  };
}

export interface InspectionItemPayload {
  itemName: string;
  category?: string;
  sortOrder?: number;
  isRequired?: boolean;
  result: "PASS" | "FAIL";
  remarks?: string;
}

export interface InspectionTemplateItem {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationFee {
  id: number;
  companyId: number;
  purpose: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  company?: { id: number; name: string };
}

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "MOBILE_MONEY"
  | "EVC"
  | "MERCHANT"
  | "CARD"
  | "OTHER";

export type CustomerPaymentStatus = "UNPAID" | "PAID";
export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";

export interface CustomerPayment {
  id: number;
  companyId: number;
  ownerId: number;
  vehicleId?: number;
  invoiceId?: number;
  amount: number;
  currency: string;
  status: CustomerPaymentStatus;
  paymentDate?: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
  owner?: Owner;
  vehicle?: Vehicle;
  invoice?: Invoice;
  company?: { id: number; name: string };
}

export interface Invoice {
  id: number;
  companyId: number;
  ownerId: number;
  vehicleId?: number;
  inspectionId?: number;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate?: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  owner?: Owner;
  vehicle?: Vehicle;
  transactions?: PaymentTransaction[];
  customerPayments?: CustomerPayment[];
  company?: { id: number; name: string };
}

export interface PaymentTransaction {
  id: number;
  invoiceId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
  invoice?: Invoice;
}

// ─── API Helper Envelopes ────────────────────────────────────────────────────

export const userApi = {
  getAll: async () => {
    const res = await api.get<User[]>("/users");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },
  create: async (data: Partial<User> & { password?: string; roleId?: number }) => {
    const res = await api.post<User>("/users", data);
    return res.data;
  },
  update: async (id: number, data: Partial<User> & { password?: string; roleId?: number | "" }) => {
    const res = await api.put<User>(`/users/${id}`, data);
    return res.data;
  },
  uploadAvatar: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post<User>(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
  login: async (username: string, password: string) => {
    const res = await api.post("/users/login", { username, password });
    return res.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.post<{ message: string }>("/users/me/change-password", data);
    return res.data;
  },
};

export const roleApi = {
  getAll: async () => {
    const res = await api.get<Role[]>("/roles");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Role>(`/roles/${id}`);
    return res.data;
  },
  create: async (data: Partial<Role>) => {
    const res = await api.post<Role>("/roles", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Role>) => {
    const res = await api.put<Role>(`/roles/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/roles/${id}`);
    return res.data;
  },
};

export const permissionApi = {
  getAll: async () => {
    const res = await api.get<Permission[]>("/permissions");
    return res.data;
  },
  create: async (data: Partial<Permission>) => {
    const res = await api.post<Permission>("/permissions", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Permission>) => {
    const res = await api.put<Permission>(`/permissions/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/permissions/${id}`);
    return res.data;
  },
};

export const rolePermissionApi = {
  getByRole: async (roleId: number) => {
    const res = await api.get<RolePermission[]>(`/role-permissions/${roleId}`);
    return res.data;
  },
  setForRole: async (roleId: number, permissionIds: number[]) => {
    const res = await api.put<RolePermission[]>(`/role-permissions/${roleId}`, {
      permissionIds,
    });
    return res.data;
  },
};

export const auditLogApi = {
  getAll: async (params?: { companyId?: number; userId?: number; entity?: string; limit?: number }) => {
    const res = await api.get<AuditLog[]>("/audit-logs", { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<AuditLog>(`/audit-logs/${id}`);
    return res.data;
  },
  create: async (data: {
    action: string;
    entity?: string;
    entityId?: number;
    details?: string;
    userId?: number;
    companyId?: number;
    ipAddress?: string;
  }) => {
    const res = await api.post<AuditLog>("/audit-logs", data);
    return res.data;
  },
};

export const companyApi = {
  getAll: async () => {
    const res = await api.get<Company[]>("/companies");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Company>(`/companies/${id}`);
    return res.data;
  },
  create: async (data: Partial<Company> & { ownerPassword: string; ownerUsername?: string }) => {
    const res = await api.post<Company>("/companies", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Company>) => {
    const res = await api.put<Company>(`/companies/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/companies/${id}`);
    return res.data;
  },
};

export const ownerApi = {
  getAll: async () => {
    const res = await api.get<Owner[]>("/owners");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Owner>(`/owners/${id}`);
    return res.data;
  },
  create: async (data: Partial<Owner>) => {
    const res = await api.post<Owner>("/owners", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Owner>) => {
    const res = await api.put<Owner>(`/owners/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/owners/${id}`);
    return res.data;
  },
};

export const vehicleApi = {
  getAll: async () => {
    const res = await api.get<Vehicle[]>("/vehicles");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Vehicle>(`/vehicles/${id}`);
    return res.data;
  },
  create: async (data: Partial<Vehicle>) => {
    const res = await api.post<Vehicle>("/vehicles", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Vehicle>) => {
    const res = await api.put<Vehicle>(`/vehicles/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/vehicles/${id}`);
    return res.data;
  },
};

export const vehicleColorApi = {
  getAll: async () => {
    const res = await api.get<VehicleColor[]>("/vehicle-colors");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<VehicleColor>(`/vehicle-colors/${id}`);
    return res.data;
  },
  create: async (data: { name: string }) => {
    const res = await api.post<VehicleColor>("/vehicle-colors", data);
    return res.data;
  },
  update: async (id: number, data: { name: string }) => {
    const res = await api.put<VehicleColor>(`/vehicle-colors/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/vehicle-colors/${id}`);
    return res.data;
  },
};

export const vehicleBrandApi = {
  getAll: async () => {
    const res = await api.get<VehicleBrand[]>("/vehicle-brands");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<VehicleBrand>(`/vehicle-brands/${id}`);
    return res.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const res = await api.post<VehicleBrand>("/vehicle-brands", data);
    return res.data;
  },
  update: async (id: number, data: { name: string; description?: string }) => {
    const res = await api.put<VehicleBrand>(`/vehicle-brands/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/vehicle-brands/${id}`);
    return res.data;
  },
};

export const vehicleModelApi = {
  getAll: async (brandId?: number) => {
    const res = await api.get<VehicleModel[]>("/vehicle-models", { params: brandId ? { brandId } : undefined });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<VehicleModel>(`/vehicle-models/${id}`);
    return res.data;
  },
  create: async (data: { brandId: number; name: string; year?: number; description?: string }) => {
    const res = await api.post<VehicleModel>("/vehicle-models", data);
    return res.data;
  },
  update: async (id: number, data: { name?: string; year?: number; description?: string }) => {
    const res = await api.put<VehicleModel>(`/vehicle-models/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/vehicle-models/${id}`);
    return res.data;
  },
};

export const inspectorApi = {
  getAll: async () => {
    const res = await api.get<Inspector[]>("/inspectors");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Inspector>(`/inspectors/${id}`);
    return res.data;
  },
  create: async (data: Partial<Inspector>) => {
    const res = await api.post<Inspector>("/inspectors", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Inspector>) => {
    const res = await api.put<Inspector>(`/inspectors/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/inspectors/${id}`);
    return res.data;
  },
};

export interface DashboardStats {
  totalVehicles: number;
  totalOwners: number;
  totalInspectors: number;
  totalInspections: number;
  pendingInspections: number;
  completedInspections: number;
  approvedInspections: number;
  failedInspections: number;
  totalInvoices: number;
  unpaidInvoices: number;
  paidAmount: number;
  unpaidAmount: number;
  totalRevenue: number;
  weeklyAnalytics: Array<{ name: string; revenue: number; inspections: number }>;
  monthlyTrends: Array<{ name: string; total: number; passed: number; failed: number }>;
  vehicleCategoryData: Array<{ name: string; value: number }>;
  recentInspections: Array<{
    id: number;
    inspectionNo: string;
    vehicle: string;
    plate: string;
    inspector: string;
    status: string;
    result?: string;
    date: string;
    total: number;
  }>;
}

export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<DashboardStats>("/dashboard/stats");
    return res.data;
  },
};

export const inspectionApi = {
  getAll: async (params?: { companyId?: number; status?: string }) => {
    const res = await api.get<Inspection[]>("/inspections", { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Inspection>(`/inspections/${id}`);
    return res.data;
  },
  create: async (data: Partial<Inspection> & { items?: InspectionItemPayload[] }) => {
    const res = await api.post<Inspection>("/inspections", data);
    return res.data;
  },
  update: async (id: number, data: Partial<Inspection>) => {
    const res = await api.put<Inspection>(`/inspections/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/inspections/${id}`);
    return res.data;
  },
  approve: async (id: number, data?: { notes?: string }) => {
    const res = await api.post<Inspection>(`/inspections/${id}/approve`, data || {});
    return res.data;
  },
  reject: async (id: number, data?: { notes?: string }) => {
    const res = await api.post<Inspection>(`/inspections/${id}/reject`, data || {});
    return res.data;
  },
  complete: async (id: number, data: { items: InspectionItemPayload[]; notes?: string }) => {
    const res = await api.post<Inspection>(`/inspections/${id}/complete`, data);
    return res.data;
  },
};

export const inspectionTemplateItemApi = {
  getAll: async () => {
    const res = await api.get<InspectionTemplateItem[]>("/inspection-template-items");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<InspectionTemplateItem>(`/inspection-template-items/${id}`);
    return res.data;
  },
  create: async (data: { name: string; sortOrder?: number }) => {
    const res = await api.post<InspectionTemplateItem>("/inspection-template-items", data);
    return res.data;
  },
  update: async (id: number, data: { name?: string; isActive?: boolean; sortOrder?: number }) => {
    const res = await api.put<InspectionTemplateItem>(`/inspection-template-items/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/inspection-template-items/${id}`);
    return res.data;
  },
};

export const registrationFeeApi = {
  getAll: async (params?: { companyId?: number }) => {
    const res = await api.get<RegistrationFee[]>("/registration-fees", { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<RegistrationFee>(`/registration-fees/${id}`);
    return res.data;
  },
  create: async (data: { purpose: string; amount: number; currency?: string; companyId?: number }) => {
    const res = await api.post<RegistrationFee>("/registration-fees", data);
    return res.data;
  },
  update: async (id: number, data: { purpose?: string; amount?: number; currency?: string; isActive?: boolean }) => {
    const res = await api.put<RegistrationFee>(`/registration-fees/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/registration-fees/${id}`);
    return res.data;
  },
};

export const customerPaymentApi = {
  getAll: async (params?: { status?: CustomerPaymentStatus; companyId?: number }) => {
    const res = await api.get<CustomerPayment[]>("/customer-payments", { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<CustomerPayment>(`/customer-payments/${id}`);
    return res.data;
  },
  update: async (id: number, data: { amount?: number; currency?: string; notes?: string }) => {
    const res = await api.put<CustomerPayment>(`/customer-payments/${id}`, data);
    return res.data;
  },
  markPaid: async (
    id: number,
    data: { method: PaymentMethod; reference?: string; notes?: string }
  ) => {
    const res = await api.post<{
      customerPayment: CustomerPayment;
      invoice: Invoice;
      transaction: PaymentTransaction;
    }>(`/customer-payments/${id}/paid`, data);
    return res.data;
  },
  syncForVehicle: async (vehicleId: number) => {
    const res = await api.post<CustomerPayment>(`/customer-payments/sync/${vehicleId}`);
    return res.data;
  },
};

export const invoiceApi = {
  getAll: async (params?: { status?: InvoiceStatus; companyId?: number }) => {
    const res = await api.get<Invoice[]>("/invoices", { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },
};

export const paymentTransactionApi = {
  getAll: async (params?: { companyId?: number }) => {
    const res = await api.get<PaymentTransaction[]>("/payments", { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<PaymentTransaction>(`/payments/${id}`);
    return res.data;
  },
};
