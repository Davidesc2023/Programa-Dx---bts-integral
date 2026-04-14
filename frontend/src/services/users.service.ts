import { api } from '@/services/api';
import type { ApiResponse, PaginatedApiResponse, User } from '@/types/api.types';
import type { PaginationQuery } from '@/types/api.types';

export type CreateUserPayload = {
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERADOR' | 'LABORATORIO';
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export async function getUsers(params?: PaginationQuery): Promise<PaginatedApiResponse<User>> {
  const { data } = await api.get<PaginatedApiResponse<User>>('/users', { params });
  return data;
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
