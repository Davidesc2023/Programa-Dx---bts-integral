'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { AppointmentForm } from '@/modules/appointments/AppointmentForm';
import { useCreateAppointment } from '@/modules/appointments/useAppointments';
import type { AppointmentInput } from '@/lib/validators';

export default function NewAppointmentPage() {
  const router = useRouter();
  const mutation = useCreateAppointment();

  function handleSubmit(data: AppointmentInput) {
    mutation.mutate(
      {
        patientId: data.patientId,
        orderId: data.orderId || undefined,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        notes: data.notes || undefined,
      },
      { onSuccess: () => router.push('/appointments') },
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/appointments">
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <CalendarDays className="text-primary-600" size={20} />
          <h1 className="text-lg font-semibold text-gray-900">Nueva cita</h1>
        </div>
      </div>
      <Card padding="lg">
        <AppointmentForm
          onSubmit={handleSubmit}
          loading={mutation.isPending}
          onCancel={() => router.push('/appointments')}
        />
      </Card>
    </div>
  );
}
