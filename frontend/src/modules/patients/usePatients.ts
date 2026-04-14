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
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '@/services/patients.service';
import { getApiErrorMessage } from '@/services/api';
import type { PatientFormValues } from '@/lib/validators';

const PATIENTS_KEY = 'patients';
const PAGE_SIZE = 15;

// ─── List hook ─────────────────────────────────────────────────────────────────

export function usePatientList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: [PATIENTS_KEY, { page, search }],
    queryFn: () => getPatients({ page, limit: PAGE_SIZE, search: search || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    ...query,
    page,
    setPage,
    search,
    setSearch,
    totalPages: query.data?.meta.totalPages ?? 1,
    total: query.data?.meta.total ?? 0,
    patients: query.data?.data ?? [],
  };
}

// ─── Single patient hook ──────────────────────────────────────────────────────

export function usePatient(id: string) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id],
    queryFn: () => getPatientById(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

// ─── Create mutation ──────────────────────────────────────────────────────────

export function useCreatePatient(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatientFormValues) => createPatient(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      toast.success('Paciente registrado correctamente');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}

// ─── Update mutation ──────────────────────────────────────────────────────────

export function useUpdatePatient(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<PatientFormValues>) => updatePatient(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      toast.success('Paciente actualizado correctamente');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}

// ─── Delete mutation ──────────────────────────────────────────────────────────

export function useDeletePatient(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      toast.success('Paciente eliminado');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}
