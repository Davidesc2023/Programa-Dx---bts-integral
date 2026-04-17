'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useResultList, useDeleteResult } from './useResults';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole } from '@/types/enums';

export function ResultList() {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === UserRole.ADMIN || user?.role === UserRole.LABORATORIO;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useResultList({ page, limit: 20 });
  const deleteMutation = useDeleteResult();

  const results = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const filtered = search
    ? results.filter(
        (r) =>
          r.examType.toLowerCase().includes(search.toLowerCase()) ||
          r.value.toLowerCase().includes(search.toLowerCase()),
      )
    : results;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por examen o valor…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {canWrite && (
          <Link href="/results/new">
            <Button variant="primary" size="sm">
              <Plus size={14} className="mr-1.5" />
              Nuevo resultado
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
          <p className="px-4 py-6 text-sm text-red-500">Error al cargar resultados.</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-outline">Sin resultados registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Tipo de examen', 'Valor', 'Unidad', 'Rango referencia', ''].map((h) => (
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
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-surface-container-high hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-on-surface">
                      <Link href={`/results/${r.id}`} className="hover:text-primary-600">
                        {r.examType}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-on-surface-variant">{r.value}</td>
                    <td className="py-3 px-4 text-sm text-outline">{r.unit ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-outline">{r.referenceRange ?? '—'}</td>
                    <td className="py-3 px-4">
                      {canWrite && (
                        <button
                          className="p-1 rounded hover:bg-red-50 text-outline hover:text-red-500 transition-colors"
                          onClick={() => setDeleteId(r.id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-container-high text-sm text-outline">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
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
        title="Eliminar resultado"
        message="¿Deseas eliminar este resultado? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
