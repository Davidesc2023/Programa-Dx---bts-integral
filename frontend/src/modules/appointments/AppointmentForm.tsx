'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema, type AppointmentInput } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PatientPicker } from '@/components/ui/PatientPicker';

interface AppointmentFormProps {
  defaultValues?: Partial<AppointmentInput>;
  defaultPatientId?: string;
  defaultOrderId?: string;
  onSubmit: (data: AppointmentInput) => void;
  loading?: boolean;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function AppointmentForm({
  defaultValues,
  defaultPatientId,
  defaultOrderId,
  onSubmit,
  loading = false,
  onCancel,
  isEdit = false,
}: AppointmentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: defaultPatientId ?? '',
      orderId: defaultOrderId ?? '',
      scheduledAt: '',
      notes: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        patientId: defaultPatientId ?? '',
        orderId: defaultOrderId ?? '',
        scheduledAt: '',
        notes: '',
        ...defaultValues,
      });
    }
  }, [defaultValues, defaultPatientId, defaultOrderId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="patientId"
        control={control}
        render={({ field }) => (
          <PatientPicker
            label="Paciente *"
            value={field.value}
            onChange={field.onChange}
            error={errors.patientId?.message}
            disabled={isEdit}
          />
        )}
      />

      <Input
        label="ID de Orden (opcional)"
        placeholder="UUID de la orden vinculada"
        {...register('orderId')}
        error={errors.orderId?.message}
        disabled={isEdit}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Fecha y hora *
        </label>
        <input
          type="datetime-local"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          {...register('scheduledAt')}
        />
        {errors.scheduledAt && (
          <p className="text-xs text-red-500 mt-0.5">{errors.scheduledAt.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Notas</label>
        <textarea
          rows={3}
          placeholder="Observaciones adicionales…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-xs text-red-500 mt-0.5">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={loading}
          disabled={isEdit && !isDirty}
        >
          {isEdit ? 'Guardar cambios' : 'Crear cita'}
        </Button>
      </div>
    </form>
  );
}
