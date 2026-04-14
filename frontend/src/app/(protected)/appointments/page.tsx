'use client';

import { CalendarDays } from 'lucide-react';
import { AppointmentList } from '@/modules/appointments/AppointmentList';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="text-primary-600" size={24} />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Citas</h1>
          <p className="text-sm text-gray-500">Gestion de citas medicas</p>
        </div>
      </div>
      <AppointmentList />
    </div>
  );
}
