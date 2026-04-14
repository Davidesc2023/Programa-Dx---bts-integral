'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePatientList, useDeletePatient } from './usePatients';
import { DOCUMENT_TYPE_LABELS } from '@/types/enums';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function PatientList() {
  const { patients, isLoading, isError, page, setPage, setSearch, search, totalPages, total } =
    usePatientList();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeletePatient(() => setDeleteId(null));

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o documento…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Link href="/patients/new">
            <Button variant="primary" size="sm">
              <UserPlus size={15} className="mr-1.5" />
              Nuevo paciente
            </Button>
          </Link>
        </div>

        {/* Table */}
        <Card padding="none">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={5} />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500 px-6 py-8 text-center">
              Error al cargar los pacientes.
            </p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 py-10 text-center">
              {search ? 'Sin resultados para la búsqueda.' : 'No hay pacientes registrados.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nombre completo', 'Documento', 'Teléfono', 'Correo', 'Acciones'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <span className="text-xs text-gray-400 mr-1">
                          {DOCUMENT_TYPE_LABELS[p.documentType]}
                        </span>
                        {p.documentNumber}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{p.phone}</td>
                      <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                        {p.email}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/patients/${p.id}/edit`}>
                            <button
                              className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                          </Link>
                          <button
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                {total} paciente{total !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Confirm delete */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar paciente"
        message="Esta acción desactivará el registro del paciente. ¿Deseas continuar?"
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
