'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
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

// Extracted outside AppointmentList to avoid React hooks-in-inline-component crash
function StatusSelect({
  id,
  status,
  canWrite,
}: {
  id: string;
  status: AppointmentStatus;
  canWrite: boolean;
}) {
  const updateMutation = useUpdateAppointmentStatus(id);
  const options = NEXT_STATUSES[status] ?? [];
  if (!canWrite || options.length === 0) return null;
  return (
    <select
      className="text-xs rounded-lg border border-outline-variant px-2 py-1.5 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/30"
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

export function AppointmentList() {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERADOR;

  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useAppointmentList({ page, limit: 20 });
  const deleteMutation = useDeleteAppointment();

  const appointments = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

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
          <p className="px-4 py-6 text-sm text-error">Error al cargar citas.</p>
        ) : appointments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-outline">Sin citas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Fecha y hora', 'Paciente ID', 'Estado', 'Cambiar estado', ''].map((h) => (
                    <th
                      key={h}
                      className="py-2 px-4 text-left text-xs font-medium text-outline uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-t border-surface-container-high hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 text-sm text-on-surface">{formatDate(a.scheduledAt)}</td>
                    <td className="py-3 px-4 text-sm text-outline font-mono">
                      {a.patientId.slice(0, 8)}…
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_BADGE[a.status as AppointmentStatus]}>
                        {APPOINTMENT_STATUS_LABELS[a.status as AppointmentStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <StatusSelect id={a.id} status={a.status as AppointmentStatus} canWrite={canWrite} />
                    </td>
                    <td className="py-3 px-4">
                      {canWrite && (
                        <button
                          className="p-1 rounded hover:bg-error-container text-outline hover:text-error transition-colors"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-container-high text-sm text-outline">
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
