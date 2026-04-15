'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { getPortalAppointments } from '@/services/portal.service';
import type { Appointment } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';
import { AppointmentStatus } from '@/types/enums';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PROGRAMADA]: 'Programada',
  [AppointmentStatus.CONFIRMADA]: 'Confirmada',
  [AppointmentStatus.CANCELADA]: 'Cancelada',
  [AppointmentStatus.COMPLETADA]: 'Completada',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PROGRAMADA]: 'bg-blue-100 text-blue-700',
  [AppointmentStatus.CONFIRMADA]: 'bg-green-100 text-green-700',
  [AppointmentStatus.CANCELADA]: 'bg-gray-100 text-gray-400',
  [AppointmentStatus.COMPLETADA]: 'bg-purple-100 text-purple-700',
};

export default function PortalAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortalAppointments()
      .then(setAppointments)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Mis citas</h1>
      <p className="text-sm text-gray-500 mb-6">Citas agendadas en el laboratorio</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Cargando citas...</p>}

      {!loading && appointments.length === 0 && !error && (
        <p className="text-sm text-gray-500">No tienes citas registradas aún.</p>
      )}

      <div className="space-y-3">
        {appointments.map((appt) => (
          <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(appt.scheduledAt).toLocaleDateString('es-CO', { dateStyle: 'full' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(appt.scheduledAt).toLocaleTimeString('es-CO', { timeStyle: 'short' })}
                  </p>
                  {appt.notes && (
                    <p className="text-xs text-gray-600 mt-1">{appt.notes}</p>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  STATUS_COLORS[appt.status as AppointmentStatus] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {STATUS_LABELS[appt.status as AppointmentStatus] ?? appt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
