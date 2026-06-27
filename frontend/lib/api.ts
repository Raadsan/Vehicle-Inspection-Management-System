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
  role: "SUPER_ADMIN" | "OWNER" | "INSPECTOR" | "STAFF";
  roleId?: number;
  isActive: boolean;
  createdAt: string;
  customRole?: Role;
}

export interface Role {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  isActive: boolean;
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
  isActive: boolean;
}

export interface Owner {
  id: number;
  companyId: number;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  idNumber?: string;
}

export interface Vehicle {
  id: number;
  companyId: number;
  ownerId: number;
  modelId?: number;
  plateNumber: string;
  color?: string;
  year?: number;
  vin?: string;
  mileage?: number;
  status: "ACTIVE" | "INACTIVE" | "SCRAPPED" | "UNDER_INSPECTION" | "BANNED";
  model?: VehicleModel;
  owner?: Owner;
}

export interface VehicleBrand {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  brandId: number;
  name: string;
  year?: number;
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
}

export interface Inspection {
  id: number;
  companyId: number;
  vehicleId: number;
  inspectorId: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
  overallResult?: "PASS" | "FAIL" | "CONDITIONAL";
  vehicle?: Vehicle;
  inspector?: Inspector;
  createdAt?: string;
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
  create: async (data: Partial<User>) => {
    const res = await api.post<User>("/users", data);
    return res.data;
  },
  update: async (id: number, data: Partial<User>) => {
    const res = await api.put<User>(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/users/${id}`);
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
  // Supporting brands & models
  getBrands: async () => {
    const res = await api.get<VehicleBrand[]>("/vehicle-brands");
    return res.data;
  },
  getModels: async () => {
    const res = await api.get<VehicleModel[]>("/vehicle-models");
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

export const inspectionApi = {
  getAll: async () => {
    const res = await api.get<Inspection[]>("/inspections");
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Inspection>(`/inspections/${id}`);
    return res.data;
  },
  create: async (data: Partial<Inspection>) => {
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
};
