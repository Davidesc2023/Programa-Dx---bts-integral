'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resultSchema, type ResultInput } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Result } from '@/types/api.types';

interface ResultFormProps {
  defaultValues?: Partial<ResultInput>;
  defaultOrderId?: string;
  onSubmit: (data: ResultInput) => void;
  loading?: boolean;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function ResultForm({
  defaultValues,
  defaultOrderId,
  onSubmit,
  loading = false,
  onCancel,
  isEdit = false,
}: ResultFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ResultInput>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      orderId: defaultOrderId ?? '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({ orderId: defaultOrderId ?? '', ...defaultValues });
    }
  }, [defaultValues, defaultOrderId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEdit && (
        <Input
          label="ID de Orden *"
          placeholder="UUID de la orden"
          {...register('orderId')}
          error={errors.orderId?.message}
        />
      )}

      <Input
        label="Tipo de examen *"
        placeholder="Ej. Hemoglobina, Glucosa"
        {...register('examType')}
        error={errors.examType?.message}
      />

      <Input
        label="Valor *"
        placeholder="Ej. 12.5"
        {...register('value')}
        error={errors.value?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Unidad"
          placeholder="Ej. g/dL, mg/dL"
          {...register('unit')}
          error={errors.unit?.message}
        />
        <Input
          label="Rango de referencia"
          placeholder="Ej. 12–16 g/dL"
          {...register('referenceRange')}
          error={errors.referenceRange?.message}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Notas</label>
        <textarea
          rows={3}
          placeholder="Observaciones adicionales…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          {...register('notes')}
        />
        {errors.notes && <p className="text-xs text-red-500 mt-0.5">{errors.notes.message}</p>}
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
          {isEdit ? 'Guardar cambios' : 'Crear resultado'}
        </Button>
      </div>
    </form>
  );
}
