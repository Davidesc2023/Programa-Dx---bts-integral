'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAppointmentList, useUpdateAppointmentStatus, useDeleteAppointment } from './useAppointments';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from '@/types/enums';
import type { BadgeVariant } from '@/components/ui/Badge';

const STATUS_BADGE: Record<AppointmentStatus, BadgeVariant> = {
  [AppointmentStatus.PROGRAMADA]: 'info',
  [AppointmentStatus.CONFIRMADA]: 'success',
  [AppointmentStatus.CANCELADA]: 'danger',
  [AppointmentStatus.COMPLETADA]: 'teal',
};

const NEXT_STATUSES: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  [AppointmentStatus.PROGRAMADA]: [AppointmentStatus.CONFIRMADA, AppointmentStatus.CANCELADA],
  [AppointmentStatus.CONFIRMADA]: [AppointmentStatus.COMPLETADA, AppointmentStatus.CANCELADA],
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function AppointmentList() {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERADOR;

  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useAppointmentList({ page, limit: 20 });
  const deleteMutation = useDeleteAppointment();

  const appointments = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  function StatusSelect({ id, status }: { id: string; status: AppointmentStatus }) {
    const updateMutation = useUpdateAppointmentStatus(id);
    const options = NEXT_STATUSES[status] ?? [];
    if (!canWrite || options.length === 0) return null;
    return (
      <select
        className="text-xs rounded border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
        defaultValue=""
        onChange={(e) => {
          const val = e.target.value as AppointmentStatus;
          if (val) updateMutation.mutate(val);
          e.target.value = '';
        }}
      >
        <option value="" disabled>
          Cambiar…
        </option>
        {options.map((s) => (
          <option key={s} value={s}>
            {APPOINTMENT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {canWrite && (
          <Link href="/appointments/new">
            <Button variant="primary" size="sm">
              <Plus size={14} className="mr-1.5" />
              Nueva cita
            </Button>
          </Link>
        )}
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : isError ? (
          <p className="px-4 py-6 text-sm text-red-500">Error al cargar citas.</p>
        ) : appointments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">Sin citas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha y hora', 'Paciente ID', 'Estado', 'Cambiar estado', ''].map((h) => (
                    <th
                      key={h}
                      className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(a.scheduledAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                      {a.patientId.slice(0, 8)}…
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_BADGE[a.status as AppointmentStatus]}>
                        {APPOINTMENT_STATUS_LABELS[a.status as AppointmentStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <StatusSelect id={a.id} status={a.status as AppointmentStatus} />
                    </td>
                    <td className="py-3 px-4">
                      {canWrite && (
                        <button
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          onClick={() => setDeleteId(a.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        title="Eliminar cita"
        message="¿Deseas eliminar esta cita? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
