import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '@/services/appointments.service';
import type { GetAppointmentsParams, CreateAppointmentPayload, UpdateAppointmentPayload } from '@/services/appointments.service';
import type { AppointmentStatus } from '@/types/enums';
import { getApiErrorMessage } from '@/services/api';

export function useAppointmentList(params: GetAppointmentsParams = {}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => getAppointments(params),
    staleTime: 30_000,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentById(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita creada correctamente.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAppointmentPayload) => updateAppointment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      toast.success('Cita actualizada.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateAppointmentStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: AppointmentStatus) => updateAppointmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      toast.success('Estado de cita actualizado.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita eliminada.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
