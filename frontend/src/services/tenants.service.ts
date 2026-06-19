import { api } from './api';

export interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  colorPrimario?: string;
  logoUrl?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateTenantDto {
  nombre: string;
  slug: string;
  colorPrimario?: string;
  logoUrl?: string;
  emailContacto?: string;
}

export interface UpdateTenantDto {
  nombre?: string;
  colorPrimario?: string;
  logoUrl?: string;
  emailContacto?: string;
  telefonoContacto?: string;
}

export const tenantsService = {
  list: () => api.get<{ data: Tenant[] }>('/tenants').then(r => r.data.data),
  get: (id: string) => api.get<{ data: Tenant }>(`/tenants/${id}`).then(r => r.data.data),
  create: (dto: CreateTenantDto) => api.post<{ data: Tenant }>('/tenants', dto).then(r => r.data.data),
  update: (id: string, dto: UpdateTenantDto) => api.patch<{ data: Tenant }>(`/tenants/${id}`, dto).then(r => r.data.data),
  toggle: (id: string) => api.patch(`/tenants/${id}/toggle`),
};
