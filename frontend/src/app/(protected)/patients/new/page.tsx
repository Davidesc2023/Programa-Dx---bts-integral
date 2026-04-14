'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { PatientForm } from '@/modules/patients/PatientForm';
import { useCreatePatient } from '@/modules/patients/usePatients';
import type { PatientFormValues } from '@/lib/validators';

export default function NewPatientPage() {
  const router = useRouter();
  const mutation = useCreatePatient(() => router.push('/patients'));

  function handleSubmit(values: PatientFormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card padding="lg">
        <CardHeader
          title="Registrar paciente"
          description="Completa los datos del nuevo paciente"
        />
        <div className="mt-6">
          <PatientForm
            onSubmit={handleSubmit}
            isLoading={mutation.isPending}
            onCancel={() => router.push('/patients')}
          />
        </div>
      </Card>
    </div>
  );
}
