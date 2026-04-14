'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, type PatientFormValues } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DocumentType } from '@/types/enums';
import type { Patient } from '@/types/api.types';

const DOCUMENT_TYPE_OPTIONS = [
  { value: DocumentType.CC, label: 'Cédula de Ciudadanía' },
  { value: DocumentType.TI, label: 'Tarjeta de Identidad' },
  { value: DocumentType.RC, label: 'Registro Civil' },
  { value: DocumentType.CE, label: 'Cédula de Extranjería' },
  { value: DocumentType.DNI, label: 'DNI' },
  { value: DocumentType.PASAPORTE, label: 'Pasaporte' },
  { value: DocumentType.NIT, label: 'NIT' },
];

interface PatientFormProps {
  defaultValues?: Partial<Patient>;
  onSubmit: (values: PatientFormValues) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function PatientForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  onCancel,
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      documentType: defaultValues?.documentType as PatientFormValues['documentType'] | undefined,
      documentNumber: defaultValues?.documentNumber ?? '',
      birthDate: defaultValues?.birthDate
        ? defaultValues.birthDate.slice(0, 10)
        : '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      city: defaultValues?.city ?? '',
      address: defaultValues?.address ?? '',
      insurance: defaultValues?.insurance ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Ej. Juan"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Apellido"
          placeholder="Ej. Pérez"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Tipo de documento
          </label>
          <select
            {...register('documentType')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
          >
            <option value="">Seleccionar…</option>
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.documentType && (
            <p className="text-xs text-red-500">{errors.documentType.message}</p>
          )}
        </div>

        <Input
          label="Número de documento"
          placeholder="Ej. 12345678"
          error={errors.documentNumber?.message}
          {...register('documentNumber')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de nacimiento"
          type="date"
          error={errors.birthDate?.message}
          {...register('birthDate')}
        />
        <Input
          label="Teléfono"
          placeholder="Ej. 3001234567"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="paciente@correo.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Ciudad"
          placeholder="Ej. Bogotá"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="EPS / Aseguradora"
          placeholder="Ej. Sura"
          error={errors.insurance?.message}
          {...register('insurance')}
        />
      </div>

      <Input
        label="Dirección"
        placeholder="Ej. Calle 123 # 45-67"
        error={errors.address?.message}
        {...register('address')}
      />

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {defaultValues?.id ? 'Guardar cambios' : 'Registrar paciente'}
        </Button>
      </div>
    </form>
  );
}
