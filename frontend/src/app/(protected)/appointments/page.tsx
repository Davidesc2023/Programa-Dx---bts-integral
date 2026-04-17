'use client';

import { CalendarDays } from 'lucide-react';
import { AppointmentList } from '@/modules/appointments/AppointmentList';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="text-primary-container shrink-0" size={24} />
        <div>
          <h1 className="text-xl font-extrabold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>Citas</h1>
          <p className="text-sm text-outline">Gestión de citas médicas</p>
        </div>
      </div>
      <AppointmentList />
    </div>
  );
}
