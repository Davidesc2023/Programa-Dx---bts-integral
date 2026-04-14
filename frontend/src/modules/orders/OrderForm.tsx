'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema, type OrderFormValues } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Priority } from '@/types/enums';
import type { Order } from '@/types/api.types';

const PRIORITY_OPTIONS = [
  { value: Priority.NORMAL, label: 'Normal' },
  { value: Priority.URGENTE, label: 'Urgente' },
  { value: Priority.RUTINA, label: 'Rutina' },
];

interface OrderFormProps {
  defaultValues?: Partial<Order>;
  preselectedPatientId?: string;
  onSubmit: (values: OrderFormValues) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function OrderForm({
  defaultValues,
  preselectedPatientId,
  onSubmit,
  isLoading = false,
  onCancel,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      patientId: defaultValues?.patientId ?? preselectedPatientId ?? '',
      physician: defaultValues?.physician ?? '',
      doctorId: defaultValues?.doctorId ?? '',
      priority: (defaultValues?.priority as OrderFormValues['priority']) ?? 'NORMAL',
      estimatedCompletionDate: defaultValues?.estimatedCompletionDate?.slice(0, 10) ?? '',
      observations: defaultValues?.observations ?? '',
    },
  });

  // Sync preselected patient if provided late
  useEffect(() => {
    if (preselectedPatientId) setValue('patientId', preselectedPatientId);
  }, [preselectedPatientId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="ID del paciente"
        placeholder="UUID del paciente"
        hint="Puedes obtenerlo desde el módulo de Pacientes"
        error={errors.patientId?.message}
        {...register('patientId')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Médico solicitante"
          placeholder="Ej. Dr. Martínez"
          error={errors.physician?.message}
          {...register('physician')}
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Prioridad</label>
          <select
            {...register('priority')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p className="text-xs text-red-500">{errors.priority.message}</p>
          )}
        </div>
      </div>

      <Input
        label="Fecha estimada de completado"
        type="date"
        error={errors.estimatedCompletionDate?.message}
        {...register('estimatedCompletionDate')}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Observaciones{' '}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Notas clínicas relevantes…"
          {...register('observations')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {defaultValues?.id ? 'Guardar cambios' : 'Crear orden'}
        </Button>
      </div>
    </form>
  );
}
