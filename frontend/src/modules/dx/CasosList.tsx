'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { listarCasos, generarReporte } from '@/services/admin-dx.service';
import type { ReporteRow } from '@/types/dx.types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_LABELS: Record<string, string> = {
  SOLICITUD_RECIBIDA: 'Solicitud recibida', EN_PROGRAMACION: 'En programación',
  PENDIENTE_AUTORIZACION: 'Pendiente autorización', AUTORIZADO: 'Autorizado',
  PROGRAMADO: 'Programado', MUESTRA_TOMADA: 'Muestra tomada',
  RESULTADO_SERICO_DISPONIBLE: 'Resultado sérico', CON_INDICACION_GENETICA: 'Con indicación',
  SIN_INDICACION_GENETICA: 'Sin indicación', GENETICA_PROGRAMADA: 'Genética programada',
  GENETICA_EN_PROCESAMIENTO: 'Genética en proceso', GENETICA_RESULTADO_DISPONIBLE: 'Resultado genético',
  COMPLETADO: 'Completado', NO_ACEPTO: 'No aceptó', SIN_CONTACTO_EFECTIVO: 'Sin contacto',
  CANCELADO: 'Cancelado', FALLECIDO: 'Fallecido', DATOS_INCOMPLETOS: 'Datos incompletos',
};

const ESTADO_COLOR: Record<string, string> = {
  SOLICITUD_RECIBIDA: '#6b7280', EN_PROGRAMACION: '#d97706', PENDIENTE_AUTORIZACION: '#f59e0b',
  AUTORIZADO: '#16a34a', PROGRAMADO: '#2563eb', MUESTRA_TOMADA: '#7c3aed',
  RESULTADO_SERICO_DISPONIBLE: '#0891b2', CON_INDICACION_GENETICA: '#65a30d',
  SIN_INDICACION_GENETICA: '#1B7A6B', COMPLETADO: '#1B7A6B', NO_ACEPTO: '#ba1a1a',
  CANCELADO: '#9ca3af', FALLECIDO: '#374151',
};

const PROGRAMA_LABELS: Record<string, string> = {
  WILSON: 'Wilson', DAAT: 'DAAT', DUCHENNE: 'Duchenne',
};

const selectCls = 'px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(27,122,107,0.20)]';
const selectStyle = { background: '#f2f4f4', border: '1px solid #bec9c5', color: '#191c1d' };

// ─── CSV helpers ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'Consecutivo', 'Programa', 'País', 'Estado', 'Autorización',
  'Médico', 'Email médico', 'Institución médico',
  'Paciente', 'Tipo doc', 'Num doc',
  'Indicación genética', 'Sérico 1', 'Interpretación sérica',
  'Estado genético', 'Seguimiento clínico',
  'Mes solicitud', 'Fecha creación',
];

function escapeField(v: unknown): string {
  const s = v == null ? '' : String(v);
  // Wrap in quotes if the value contains comma, quote or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToArray(r: ReporteRow): string[] {
  return [
    r.consecutivo,
    r.programas?.codigo ?? '',
    r.pais_codigo,
    ESTADO_LABELS[r.estado] ?? r.estado,
    r.paciente_autorizacion ?? '',
    r.medico_nombre,
    r.medico_email,
    r.medico_institucion ?? '',
    r.paciente_nombre,
    r.paciente_tipo_doc ?? '',
    r.paciente_num_doc ?? '',
    r.tiene_indicacion_genetica == null ? '' : r.tiene_indicacion_genetica ? 'Sí' : 'No',
    r.resultado_serico_1 ?? '',
    r.interpretacion_serico ?? '',
    r.estado_genetico ?? '',
    r.seguimiento_clinico ?? '',
    r.mes_solicitud,
    new Date(r.created_at).toLocaleDateString('es-CO'),
  ].map(escapeField);
}

function buildCsv(rows: ReporteRow[]): string {
  const BOM = '﻿';
  const header = CSV_HEADERS.map(escapeField).join(',');
  const body = rows.map((r) => rowToArray(r).join(',')).join('\r\n');
  return BOM + header + '\r\n' + body;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CasosList() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const estado   = searchParams.get('estado')   ?? '';
  const programa = searchParams.get('programa') ?? '';
  const q        = searchParams.get('q')        ?? '';
  const page     = Number(searchParams.get('page') ?? '1');

  const [isExporting, setIsExporting] = useState(false);

  const setParam = useCallback((key: string, val: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    router.push(`/dx/casos?${p.toString()}`);
  }, [router, searchParams]);

  const setPage = (n: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', String(n));
    router.push(`/dx/casos?${p.toString()}`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await generarReporte({
        estado: estado || undefined,
        programa: programa || undefined,
        q: q || undefined,
      });
      const csv = buildCsv(rows);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `casos-dx-${date}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['dx-casos', { estado, programa, q, page }],
    queryFn: () => listarCasos({ estado: estado || undefined, programa: programa || undefined, q: q || undefined, page }),
    staleTime: 15_000,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#191c1d' }}>Casos DX</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6e7976' }}>
            {data ? `${data.meta.total} casos en total` : 'Cargando…'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exportando…' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Buscar"
            placeholder="Consecutivo, paciente, médico…"
            defaultValue={q}
            onChange={(e) => {
              // debounce: update on blur
            }}
            onBlur={(e) => setParam('q', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Estado</label>
          <select
            className={selectCls}
            style={selectStyle}
            value={estado}
            onChange={(e) => setParam('estado', e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(ESTADO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Programa</label>
          <select
            className={selectCls}
            style={selectStyle}
            value={programa}
            onChange={(e) => setParam('programa', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="WILSON">Wilson</option>
            <option value="DAAT">DAAT (Alfa-1)</option>
            <option value="DUCHENNE">Duchenne</option>
          </select>
        </div>

        {(estado || programa || q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dx/casos')}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9eaaa7' }}>
            Cargando casos…
          </div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9eaaa7' }}>
            No se encontraron casos con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid #e0e8e5' }}>
                <tr>
                  {['Consecutivo', 'Paciente', 'Médico', 'Programa', 'País', 'Estado', 'Fecha', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9eaaa7' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f2f4f4' }} className="hover:bg-[#f8fafa] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#1B7A6B' }}>
                      {c.consecutivo}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#191c1d' }}>
                      <div className="font-medium">{c.paciente_nombre}</div>
                      <div className="text-xs" style={{ color: '#9eaaa7' }}>{c.paciente_iniciales}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]" style={{ color: '#3e4946' }}>
                      <div className="truncate">{c.medico_nombre}</div>
                      <div className="text-xs truncate" style={{ color: '#9eaaa7' }}>{c.medico_email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6e7976' }}>
                      {PROGRAMA_LABELS[c.programas?.codigo] ?? c.programas?.codigo}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: '#6e7976' }}>
                      {c.pais_codigo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                        style={{
                          background: `${ESTADO_COLOR[c.estado] ?? '#6b7280'}18`,
                          color: ESTADO_COLOR[c.estado] ?? '#6b7280',
                        }}
                      >
                        {ESTADO_LABELS[c.estado] ?? c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#9eaaa7' }}>
                      {new Date(c.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dx/casos/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ background: 'rgba(27,122,107,0.08)', color: '#1B7A6B' }}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#9eaaa7' }}>
            Página {data.meta.page} de {data.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
