'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getConsentByOrder,
  createConsent,
  signConsent,
  sendConsent,
  respondConsent,
} from '@/services/consents.service';
import { getApiErrorMessage } from '@/services/api';

const key = (orderId: string) => ['consent', orderId];

export function useConsent(orderId: string) {
  return useQuery({
    queryKey: key(orderId),
    queryFn: () => getConsentByOrder(orderId),
    enabled: Boolean(orderId),
    retry: (failureCount, error: unknown) => {
      // Don't retry 404 — consent may not exist yet
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
    staleTime: 30_000,
  });
}

export function useCreateConsent(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => createConsent(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(orderId) });
      toast.success('Consentimiento creado');
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

export function useSignConsent(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => signConsent(orderId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(orderId) });
      qc.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Consentimiento firmado por el médico');
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

export function useSendConsent(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendConsent(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(orderId) });
      toast.success('Consentimiento enviado al paciente');
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

export function useRespondConsent(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (response: 'ACEPTADO' | 'RECHAZADO') =>
      respondConsent(orderId, response),
    onSuccess: (consent) => {
      qc.invalidateQueries({ queryKey: key(orderId) });
      qc.invalidateQueries({ queryKey: ['orders', orderId] });
      const msg =
        consent.status === 'ACEPTADO'
          ? 'Consentimiento aceptado por el paciente'
          : 'Consentimiento rechazado por el paciente';
      toast.success(msg);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}
