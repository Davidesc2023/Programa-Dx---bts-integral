import { api } from '@/services/api';
import type { ApiResponse, PaginatedApiResponse, User } from '@/types/api.types';
import type { PaginationQuery } from '@/types/api.types';
import type { UserRole } from '@/types/enums';

export type CreateUserPayload = {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  specialty?: string;
  medicalLicense?: string;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type UsersQuery = PaginationQuery & {
  role?: UserRole;
  search?: string;
};

export async function getUsers(params?: UsersQuery): Promise<PaginatedApiResponse<User>> {
  const { data } = await api.get<PaginatedApiResponse<User>>('/users', { params });
  return data;
}

export async function getDoctors(search?: string): Promise<User[]> {
  const params: UsersQuery = { role: UserRole.MEDICO, limit: 20, page: 1 };
  if (search) params.search = search;
  const res = await getUsers(params);
  return res.data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/users', payload);
  return data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
