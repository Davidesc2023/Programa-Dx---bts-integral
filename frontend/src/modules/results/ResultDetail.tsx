'use client';

import Link from 'next/link';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { AttachmentsPanel } from './AttachmentsPanel';
import { useResult } from './useResults';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole } from '@/types/enums';

interface ResultDetailProps {
  resultId: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ResultDetail({ resultId }: ResultDetailProps) {
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === UserRole.ADMIN || user?.role === UserRole.LABORATORIO;
  const { data: result, isLoading, isError } = useResult(resultId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-sm text-red-500">
        No se pudo cargar el resultado.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/results">
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h2 className="text-lg font-semibold text-gray-900">{result.examType}</h2>
        </div>
        {canWrite && (
          <Link href={`/results/${resultId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit3 size={14} className="mr-1.5" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Details */}
      <Card padding="lg">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Valor</dt>
            <dd className="text-gray-900 font-semibold text-lg">{result.value}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Unidad</dt>
            <dd className="text-gray-900">{result.unit ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Rango referencia</dt>
            <dd className="text-gray-900">{result.referenceRange ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Creado</dt>
            <dd className="text-gray-900">{formatDate(result.createdAt)}</dd>
          </div>
          {result.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Notas</dt>
              <dd className="text-gray-700">{result.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Attachments */}
      <Card padding="lg">
        <CardHeader title="Archivos adjuntos" />
        <div className="mt-4">
          <AttachmentsPanel resultId={resultId} />
        </div>
      </Card>
    </div>
  );
}
