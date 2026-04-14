'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/services/users.service';
import { getApiErrorMessage } from '@/services/api';

const USERS_KEY = 'users';
const PAGE_SIZE = 15;

// ─── List hook ─────────────────────────────────────────────────────────────────

export function useUserList() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: [USERS_KEY, { page }],
    queryFn: () => getUsers({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    ...query,
    page,
    setPage,
    totalPages: query.data?.meta.totalPages ?? 1,
    total: query.data?.meta.total ?? 0,
    users: query.data?.data ?? [],
  };
}

// ─── Create mutation ──────────────────────────────────────────────────────────

export function useCreateUser(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('Usuario creado correctamente');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}

// ─── Update mutation ──────────────────────────────────────────────────────────

export function useUpdateUser(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('Usuario actualizado correctamente');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}

// ─── Delete mutation ──────────────────────────────────────────────────────────

export function useDeleteUser(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('Usuario eliminado');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}
