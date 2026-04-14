'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PatientForm } from '@/modules/patients/PatientForm';
import { usePatient, useUpdatePatient } from '@/modules/patients/usePatients';
import type { PatientFormValues } from '@/lib/validators';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditPatientPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: patient, isLoading, isError } = usePatient(id);
  const mutation = useUpdatePatient(id, () => router.push('/patients'));

  function handleSubmit(values: PatientFormValues) {
    mutation.mutate(values);
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card padding="lg">
          <LoadingSkeleton rows={6} />
        </Card>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <p className="text-sm text-red-500 text-center mt-10">
        No se pudo cargar el paciente.
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card padding="lg">
        <CardHeader
          title="Editar paciente"
          description={`${patient.firstName} ${patient.lastName}`}
        />
        <div className="mt-6">
          <PatientForm
            defaultValues={patient}
            onSubmit={handleSubmit}
            isLoading={mutation.isPending}
            onCancel={() => router.push('/patients')}
          />
        </div>
      </Card>
    </div>
  );
}
