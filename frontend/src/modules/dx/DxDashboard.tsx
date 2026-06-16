'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getDxDashboard } from '@/services/admin-dx.service';
import type {
  DxCasoItem,
  DxEstadoCount,
  DxMesProgramaCount,
  DxMedicoStats,
  DxHeatmapCell,
  DxConversionFunnel,
  DxDepartamentoCount,
  DxEstadoGeneticoCount,
  DxSeguimientoCount,
  DxAutorizacionStats,
} from '@/types/dx.types';

// ─── Paleta de colores y etiquetas ────────────────────────────────────────────

const BRAND = '#1B7A6B';

const ESTADO_LABELS: Record<string, string> = {
  SOLICITUD_RECIBIDA:            'Solicitud recibida',
  EN_PROGRAMACION:               'En programación',
  PENDIENTE_AUTORIZACION:        'Pendiente autorización',
  AUTORIZADO:                    'Autorizado',
  NO_ACEPTO:                     'No aceptó',
  PROGRAMADO:                    'Programado',
  MUESTRA_TOMADA:                'Muestra tomada',
  RESULTADO_SERICO_DISPONIBLE:   'Resultado sérico',
  CON_INDICACION_GENETICA:       'Con indicación genética',
  SIN_INDICACION_GENETICA:       'Sin indicación genética',
  GENETICA_PROGRAMADA:           'Genética programada',
  GENETICA_EN_PROCESAMIENTO:     'Genética en proceso',
  GENETICA_RESULTADO_DISPONIBLE: 'Resultado genético',
  COMPLETADO:                    'Completado',
  SIN_CONTACTO_EFECTIVO:         'Sin contacto',
  CANCELADO:                     'Cancelado',
  FALLECIDO:                     'Fallecido',
  DATOS_INCOMPLETOS:             'Datos incompletos',
};

const ESTADO_COLOR: Record<string, string> = {
  SOLICITUD_RECIBIDA:            '#6b7280',
  EN_PROGRAMACION:               '#d97706',
  PENDIENTE_AUTORIZACION:        '#f59e0b',
  AUTORIZADO:                    '#16a34a',
  NO_ACEPTO:                     '#ba1a1a',
  PROGRAMADO:                    '#2563eb',
  MUESTRA_TOMADA:                '#7c3aed',
  RESULTADO_SERICO_DISPONIBLE:   '#0891b2',
  CON_INDICACION_GENETICA:       '#65a30d',
  SIN_INDICACION_GENETICA:       BRAND,
  GENETICA_PROGRAMADA:           '#4f46e5',
  GENETICA_EN_PROCESAMIENTO:     '#7c3aed',
  GENETICA_RESULTADO_DISPONIBLE: '#9333ea',
  COMPLETADO:                    BRAND,
  SIN_CONTACTO_EFECTIVO:         '#d97706',
  CANCELADO:                     '#9ca3af',
  FALLECIDO:                     '#374151',
  DATOS_INCOMPLETOS:             '#9a3412',
};

const ESTADO_GEN_LABELS: Record<string, string> = {
  PROGRAMADO:             'Programada',
  EN_PROCESAMIENTO:       'En procesamiento',
  REALIZADO:              'Realizada',
  SIN_INDICACION_GENETICA:'Sin indicación',
  NO_ACEPTA:              'No acepta',
  N_A:                    'No aplica',
};

const ESTADO_GEN_COLOR: Record<string, string> = {
  REALIZADO:              BRAND,
  EN_PROCESAMIENTO:       '#7c3aed',
  PROGRAMADO:             '#2563eb',
  SIN_INDICACION_GENETICA:'#6b7280',
  NO_ACEPTA:              '#ba1a1a',
  N_A:                    '#e5e7eb',
};

const SEGUIMIENTO_LABELS: Record<string, string> = {
  NEGATIVO:       'Negativo',
  PORTADOR:       'Portador',
  POSITIVO:       'Positivo',
  EN_TRATAMIENTO: 'En tratamiento',
  FORMULADO:      'Formulado',
  TRASPLANTADO:   'Trasplantado',
  DROP_OUT:       'Drop-out',
  FALLECIDO:      'Fallecido',
};

const SEGUIMIENTO_COLOR: Record<string, string> = {
  NEGATIVO:       '#16a34a',
  PORTADOR:       '#f59e0b',
  POSITIVO:       '#ba1a1a',
  EN_TRATAMIENTO: BRAND,
  FORMULADO:      '#2563eb',
  TRASPLANTADO:   '#7c3aed',
  DROP_OUT:       '#6b7280',
  FALLECIDO:      '#374151',
};

const PROGRAMA_COLOR: Record<string, string> = {
  WILSON:   BRAND,
  DAAT:     '#2563eb',
  DUCHENNE: '#7c3aed',
};

const PROGRAMA_LABELS: Record<string, string> = {
  WILSON:   'Wilson',
  DAAT:     'DAAT',
  DUCHENNE: 'Duchenne',
};

const PAIS_LABELS: Record<string, string> = {
  CO: 'Colombia', EC: 'Ecuador', PA: 'Panamá', CL: 'Chile',
  CR: 'Costa Rica', SV: 'El Salvador', DO: 'Rep. Dom.', GT: 'Guatemala',
};

// ─── Utilidades ──────────────────────────────────────────────────────────────

function pct(num: number, den: number) {
  if (!den) return '0%';
  return `${Math.round((num / den) * 100)}%`;
}

function shortMes(mes: string) {
  // "2025-03" → "Mar 25"
  const [y, m] = mes.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

// ─── Componentes primitivos ───────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#e0e8e5] p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold mb-4" style={{ color: '#191c1d' }}>
      {children}
    </h2>
  );
}

function MetricCard({ label, value, sub, accent, warn }: {
  label: string; value: number | string; sub?: string; accent?: boolean; warn?: boolean;
}) {
  const color = accent ? BRAND : warn ? '#ba1a1a' : '#191c1d';
  const bg    = accent ? 'rgba(27,122,107,0.06)' : warn ? 'rgba(186,26,26,0.04)' : '#ffffff';
  const border= accent ? 'rgba(27,122,107,0.2)'  : warn ? 'rgba(186,26,26,0.2)'  : '#e0e8e5';
  return (
    <div className="rounded-2xl border p-5" style={{ background: bg, borderColor: border }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#9eaaa7' }}>{label}</p>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#9eaaa7' }}>{sub}</p>}
    </div>
  );
}

// Barra horizontal con etiqueta y conteo
function HBar({ label, count, max, color = BRAND }: {
  label: string; count: number; max: number; color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-40 truncate shrink-0" style={{ color: '#3e4946' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f2f4f4' }}>
        <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color: '#191c1d' }}>{count}</span>
    </div>
  );
}

// ─── Sección 1: Embudo de conversión ─────────────────────────────────────────

function ConversionFunnel({ f }: { f: DxConversionFunnel }) {
  const steps = [
    { label: 'Total solicitudes',      value: f.total,               color: '#6b7280' },
    { label: 'Paciente autorizó',       value: f.autorizados,         color: '#16a34a' },
    { label: 'Muestra tomada',          value: f.muestra_tomada,      color: '#2563eb' },
    { label: 'Resultado sérico',        value: f.con_resultado_serico, color: '#0891b2' },
    { label: 'Con indicación genética', value: f.con_indicacion,      color: '#65a30d' },
    { label: 'Genética realizada',      value: f.genetica_realizada,  color: '#7c3aed' },
    { label: 'Completados',             value: f.completados,         color: BRAND },
  ];

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const w = f.total > 0 ? (s.value / f.total) * 100 : 0;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs" style={{ color: '#3e4946' }}>{s.label}</span>
              <span className="text-xs font-semibold" style={{ color: '#191c1d' }}>
                {s.value}
                {i > 0 && (
                  <span className="font-normal ml-1.5" style={{ color: '#9eaaa7' }}>
                    ({pct(s.value, f.total)})
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#f2f4f4' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${w}%`, background: s.color }}
              />
            </div>
          </div>
        );
      })}
      {f.no_acepto > 0 && (
        <p className="text-xs pt-1" style={{ color: '#ba1a1a' }}>
          No aceptaron: <strong>{f.no_acepto}</strong> ({pct(f.no_acepto, f.total)})
        </p>
      )}
      <div className="pt-2 border-t border-[#f2f4f4] grid grid-cols-2 gap-2 text-xs">
        <div>
          <span style={{ color: '#9eaaa7' }}>Tasa sérico→genética: </span>
          <strong style={{ color: BRAND }}>
            {pct(f.con_indicacion, f.con_indicacion + f.sin_indicacion)}
          </strong>
        </div>
        <div>
          <span style={{ color: '#9eaaa7' }}>Sin indicación: </span>
          <strong style={{ color: '#6b7280' }}>
            {f.sin_indicacion} ({pct(f.sin_indicacion, f.con_resultado_serico)})
          </strong>
        </div>
      </div>
    </div>
  );
}

// ─── Sección 2: Gráfica temporal agrupada por programa ───────────────────────

function GroupedMonthChart({ items }: { items: DxMesProgramaCount[] }) {
  const programas = Array.from(new Set(items.map(i => i.programa))).sort();
  const meses = Array.from(new Set(items.map(i => i.mes))).sort().slice(-12);
  const maxVal = Math.max(...items.map(i => i.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 min-w-max" style={{ minHeight: 80 }}>
        {meses.map(mes => (
          <div key={mes} className="flex flex-col items-center gap-0.5" style={{ minWidth: 36 }}>
            <div className="flex items-end gap-0.5 h-16">
              {programas.map(prog => {
                const item = items.find(i => i.mes === mes && i.programa === prog);
                const count = item?.count ?? 0;
                const h = count > 0 ? Math.max(3, (count / maxVal) * 56) : 0;
                return (
                  <div key={prog} className="relative group" style={{ width: 10 }}>
                    <div
                      className="w-full rounded-t-sm"
                      style={{ height: h, background: PROGRAMA_COLOR[prog] ?? '#ccc', opacity: count === 0 ? 0.15 : 1 }}
                      title={`${PROGRAMA_LABELS[prog] ?? prog}: ${count}`}
                    />
                    {count > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-1 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                        {PROGRAMA_LABELS[prog] ?? prog}: {count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-[9px] text-center" style={{ color: '#9eaaa7' }}>{shortMes(mes)}</span>
          </div>
        ))}
      </div>
      {/* Leyenda */}
      <div className="flex gap-4 mt-2">
        {programas.map(p => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PROGRAMA_COLOR[p] ?? '#ccc' }} />
            <span className="text-xs" style={{ color: '#6e7976' }}>{PROGRAMA_LABELS[p] ?? p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sección 3: Heatmap médico × mes ─────────────────────────────────────────

function HeatmapGrid({ cells }: { cells: DxHeatmapCell[] }) {
  const doctores = Array.from(new Map(cells.map(c => [c.medico_email, c.medico_nombre])).entries())
    .map(([email, nombre]) => ({ email, nombre }));
  const meses = Array.from(new Set(cells.map(c => c.mes))).sort().slice(-12);
  const maxVal = Math.max(...cells.map(c => c.count), 1);

  const lookup = new Map(cells.map(c => [`${c.medico_email}::${c.mes}`, c.count]));

  function heatColor(count: number) {
    if (!count) return '#f2f4f4';
    const intensity = count / maxVal;
    // Gradiente: #e8f5f2 → #1B7A6B
    const r = Math.round(232 - intensity * (232 - 27));
    const g = Math.round(245 - intensity * (245 - 122));
    const b = Math.round(242 - intensity * (242 - 107));
    return `rgb(${r},${g},${b})`;
  }

  if (!doctores.length || !meses.length) {
    return <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin datos suficientes para el heatmap.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left pr-2 font-normal w-28" style={{ color: '#9eaaa7' }}>Médico</th>
            {meses.map(m => (
              <th key={m} className="font-normal text-center" style={{ color: '#9eaaa7', minWidth: 32 }}>
                {shortMes(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doctores.map(({ email, nombre }) => (
            <tr key={email}>
              <td className="pr-2 truncate max-w-[112px]" style={{ color: '#3e4946' }} title={nombre}>
                {nombre.split(' ').slice(0, 2).join(' ')}
              </td>
              {meses.map(mes => {
                const count = lookup.get(`${email}::${mes}`) ?? 0;
                return (
                  <td key={mes} title={`${nombre} – ${shortMes(mes)}: ${count}`}>
                    <div
                      className="rounded-sm flex items-center justify-center font-semibold"
                      style={{ width: 30, height: 20, background: heatColor(count), color: count > maxVal * 0.6 ? '#fff' : '#374151' }}
                    >
                      {count || ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Escala */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px]" style={{ color: '#9eaaa7' }}>0</span>
        <div className="flex">
          {[0, 0.15, 0.3, 0.5, 0.7, 1].map(t => (
            <div key={t} style={{ width: 20, height: 10, background: heatColor(Math.round(t * maxVal)) }} />
          ))}
        </div>
        <span className="text-[10px]" style={{ color: '#9eaaa7' }}>{maxVal}</span>
      </div>
    </div>
  );
}

// ─── Sección 4: Tabla de médicos sortable ─────────────────────────────────────

type MedicoSortKey = keyof Pick<DxMedicoStats,
  'total'|'pendientes'|'en_proceso'|'sin_indicacion'|'con_indicacion'|
  'positivos'|'negativos'|'no_acepto'|'completados'|'tasa_conversion'|'tasa_completado'
>;

function MedicoTable({ medicos }: { medicos: DxMedicoStats[] }) {
  const [sortBy, setSortBy] = useState<MedicoSortKey>('total');
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...medicos].sort((a, b) => {
      const diff = (a[sortBy] as number) - (b[sortBy] as number);
      return asc ? diff : -diff;
    });
  }, [medicos, sortBy, asc]);

  function toggleSort(col: MedicoSortKey) {
    if (sortBy === col) setAsc(p => !p);
    else { setSortBy(col); setAsc(false); }
  }

  const cols: { key: MedicoSortKey; label: string; title?: string }[] = [
    { key: 'total',          label: 'Total' },
    { key: 'pendientes',     label: 'Pend.', title: 'Pendientes (sin acción)' },
    { key: 'en_proceso',     label: 'En proc.', title: 'En proceso activo' },
    { key: 'sin_indicacion', label: 'Sin ind.', title: 'Sin indicación genética' },
    { key: 'con_indicacion', label: 'Con ind.', title: 'Con indicación genética' },
    { key: 'positivos',      label: 'Pos.', title: 'Positivos (seguimiento)' },
    { key: 'negativos',      label: 'Neg.', title: 'Negativos (seguimiento)' },
    { key: 'no_acepto',      label: 'No acep.', title: 'No aceptaron / No autorizaron' },
    { key: 'completados',    label: 'Comp.', title: 'Completados' },
    { key: 'tasa_conversion', label: '% Conv.', title: '% Conversión sérica→genética' },
    { key: 'tasa_completado', label: '% Comp.', title: '% Tasa de completado' },
  ];

  const Th = ({ col }: { col: typeof cols[0] }) => (
    <th
      className="px-2 py-2 text-right text-[10px] font-semibold cursor-pointer select-none whitespace-nowrap"
      style={{ color: sortBy === col.key ? BRAND : '#9eaaa7' }}
      onClick={() => toggleSort(col.key)}
      title={col.title}
    >
      {col.label} {sortBy === col.key ? (asc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0">
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e8e5' }}>
            <th className="px-3 py-2 text-left text-[10px] font-semibold" style={{ color: '#9eaaa7' }}>Médico</th>
            {cols.map(c => <Th key={c.key} col={c} />)}
          </tr>
        </thead>
        <tbody>
          {sorted.map(m => (
            <tr key={m.medico_email} className="hover:bg-[#f8fafa]" style={{ borderBottom: '1px solid #f2f4f4' }}>
              <td className="px-3 py-2.5 max-w-[180px]">
                <div className="font-medium truncate" style={{ color: '#191c1d' }}>{m.medico_nombre}</div>
                <div className="text-[10px] truncate" style={{ color: '#9eaaa7' }}>{m.medico_email}</div>
              </td>
              {cols.map(c => {
                const v = m[c.key] as number;
                const isPct = c.key === 'tasa_conversion' || c.key === 'tasa_completado';
                const hilight = (c.key === 'positivos' && v > 0)
                  ? '#ba1a1a'
                  : (c.key === 'no_acepto' && v > 0)
                  ? '#d97706'
                  : (c.key === 'tasa_conversion' || c.key === 'completados')
                  ? BRAND
                  : '#191c1d';
                return (
                  <td key={c.key} className="px-2 py-2.5 text-right font-mono" style={{ color: v === 0 ? '#d1d5db' : hilight }}>
                    {isPct ? `${v}%` : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sección 5: Tabla de casos recientes ─────────────────────────────────────

function RecentTable({ casos }: { casos: DxCasoItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid #e0e8e5' }}>
            {['Consecutivo','Paciente','Médico','Programa','Estado',''].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: '#9eaaa7' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {casos.map(c => (
            <tr key={c.id} className="hover:bg-[#f8fafa]" style={{ borderBottom: '1px solid #f2f4f4' }}>
              <td className="px-3 py-3 font-mono text-xs font-bold" style={{ color: BRAND }}>{c.consecutivo}</td>
              <td className="px-3 py-3" style={{ color: '#191c1d' }}>{c.paciente_iniciales}</td>
              <td className="px-3 py-3 truncate max-w-[140px]" style={{ color: '#3e4946' }}>{c.medico_nombre}</td>
              <td className="px-3 py-3 text-xs" style={{ color: '#6e7976' }}>
                {PROGRAMA_LABELS[c.programas?.codigo] ?? c.programas?.codigo}
              </td>
              <td className="px-3 py-3">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: `${ESTADO_COLOR[c.estado] ?? '#6b7280'}18`,
                    color: ESTADO_COLOR[c.estado] ?? '#6b7280',
                  }}
                >
                  {ESTADO_LABELS[c.estado] ?? c.estado}
                </span>
              </td>
              <td className="px-3 py-3">
                <Link href={`/dx/casos/${c.id}`} className="text-xs font-medium hover:underline" style={{ color: BRAND }}>
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente principal DxDashboard ────────────────────────────────────────

export function DxDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dx-dashboard'],
    queryFn: getDxDashboard,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: '#e0e8e5' }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#e0e8e5' }} />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#e0e8e5' }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm" style={{ color: '#ba1a1a' }}>
        Error al cargar el dashboard. Verifique que esté autenticado.
      </p>
    );
  }

  // ── Métricas derivadas ────────────────────────────────────────────────────
  const totalCasos      = data.por_estado.reduce((s, e) => s + e.count, 0);
  const completados     = data.por_estado.find(e => e.estado === 'COMPLETADO')?.count ?? 0;
  const cancelados      = (data.por_estado.find(e => e.estado === 'CANCELADO')?.count ?? 0)
                        + (data.por_estado.find(e => e.estado === 'NO_ACEPTO')?.count ?? 0);
  const f               = data.conversion_funnel ?? {} as DxConversionFunnel;
  const tasaConv        = f.con_resultado_serico
    ? Math.round((f.con_indicacion / (f.con_indicacion + f.sin_indicacion)) * 100)
    : 0;
  const tasaComp        = totalCasos ? Math.round((completados / totalCasos) * 100) : 0;
  const auth            = data.tasa_autorizacion ?? { autorizado: 0, no_autorizado: 0, pendiente: 0 };
  const totalAuth       = auth.autorizado + auth.no_autorizado + auth.pendiente;
  const tasaAuth        = totalAuth ? Math.round((auth.autorizado / totalAuth) * 100) : 0;

  const maxDept = Math.max(...(data.por_departamento ?? []).map(d => d.count), 1);
  const maxEG   = Math.max(...(data.estado_genetico_dist ?? []).map(d => d.count), 1);
  const maxSG   = Math.max(...(data.seguimiento_dist ?? []).map(d => d.count), 1);
  const maxEst  = Math.max(...data.por_estado.map(e => e.count), 1);

  return (
    <div className="space-y-6">

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#191c1d' }}>Panel DX — Analytics</h1>
        <p className="text-sm mt-1" style={{ color: '#6e7976' }}>
          Seguimiento integral del programa de diagnóstico genético
        </p>
      </div>

      {/* ── KPIs principales (6 tarjetas) ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Total casos"           value={totalCasos}                        accent />
        <MetricCard label="Pendientes autorizac." value={data.pendientes_autorizacion}       warn={data.pendientes_autorizacion > 0} />
        <MetricCard label="Con ind. genética"     value={f.con_indicacion ?? 0}              sub={`Sin: ${f.sin_indicacion ?? 0}`} />
        <MetricCard label="Completados"           value={completados}                        sub={`${tasaComp}% del total`} accent />
        <MetricCard label="% Conversión sérica"   value={`${tasaConv}%`}                    sub="sérico → genética" />
        <MetricCard label="% Autorización"        value={`${tasaAuth}%`}                    sub={`${auth.no_autorizado} no autorizaron`} />
      </div>

      {/* ── Tendencia temporal + embudo ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Solicitudes por mes y programa (últimos 12 meses)</SectionTitle>
          {(data.por_mes_programa ?? []).length > 0
            ? <GroupedMonthChart items={data.por_mes_programa} />
            : <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin datos temporales.</p>
          }
        </Card>

        <Card>
          <SectionTitle>Embudo de conversión clínica</SectionTitle>
          {f.total > 0
            ? <ConversionFunnel f={f} />
            : <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin datos.</p>
          }
        </Card>
      </div>

      {/* ── Distribución estados sérico + genético ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <SectionTitle>Estado del caso</SectionTitle>
          <div className="space-y-2">
            {data.por_estado
              .filter(e => e.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ estado, count }) => (
                <HBar key={estado} label={ESTADO_LABELS[estado] ?? estado} count={count} max={maxEst} color={ESTADO_COLOR[estado] ?? BRAND} />
              ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Estado prueba genética</SectionTitle>
          <div className="space-y-2">
            {(data.estado_genetico_dist ?? [])
              .filter(e => e.estado_genetico !== 'N_A' && e.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ estado_genetico, count }) => (
                <HBar
                  key={estado_genetico}
                  label={ESTADO_GEN_LABELS[estado_genetico] ?? estado_genetico}
                  count={count}
                  max={maxEG}
                  color={ESTADO_GEN_COLOR[estado_genetico] ?? '#6b7280'}
                />
              ))}
            {(data.estado_genetico_dist ?? []).length === 0 && (
              <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin resultados genéticos aún.</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle>Seguimiento clínico</SectionTitle>
          <div className="space-y-2">
            {(data.seguimiento_dist ?? [])
              .filter(s => s.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ seguimiento_clinico, count }) => (
                <HBar
                  key={seguimiento_clinico}
                  label={SEGUIMIENTO_LABELS[seguimiento_clinico] ?? seguimiento_clinico}
                  count={count}
                  max={maxSG}
                  color={SEGUIMIENTO_COLOR[seguimiento_clinico] ?? '#6b7280'}
                />
              ))}
            {(data.seguimiento_dist ?? []).length === 0 && (
              <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin registros de seguimiento aún.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ── Autorización + Por año + Por programa ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tasas de autorización */}
        <Card>
          <SectionTitle>Autorización del paciente</SectionTitle>
          <div className="space-y-3">
            {[
              { label: 'Autorizó',       value: auth.autorizado,    color: '#16a34a' },
              { label: 'No autorizó',    value: auth.no_autorizado, color: '#ba1a1a' },
              { label: 'Pendiente',      value: auth.pendiente,     color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: '#3e4946' }}>{label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color }}>{value}</span>
                  <span className="text-xs ml-1" style={{ color: '#9eaaa7' }}>
                    {pct(value, totalAuth)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Por año */}
        <Card>
          <SectionTitle>Solicitudes por año</SectionTitle>
          {(data.por_ano ?? []).length > 0 ? (
            <div className="flex items-end gap-3 h-20 pt-2">
              {data.por_ano.map(({ ano, count }) => {
                const maxAno = Math.max(...data.por_ano.map(a => a.count), 1);
                return (
                  <div key={ano} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold" style={{ color: '#191c1d' }}>{count}</span>
                    <div
                      className="w-full rounded-t-sm"
                      style={{ height: Math.max(4, (count / maxAno) * 48), background: BRAND, opacity: 0.85 }}
                    />
                    <span className="text-[10px]" style={{ color: '#9eaaa7' }}>{ano}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin datos.</p>
          )}
        </Card>

        {/* Por programa */}
        <Card>
          <SectionTitle>Por programa</SectionTitle>
          <div className="space-y-3">
            {data.por_programa.map(p => (
              <div key={p.codigo} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PROGRAMA_COLOR[p.codigo] ?? '#ccc' }} />
                  <span className="text-xs" style={{ color: '#3e4946' }}>{PROGRAMA_LABELS[p.codigo] ?? p.codigo}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: '#191c1d' }}>{p.count}</span>
                  <span className="text-xs ml-1" style={{ color: '#9eaaa7' }}>{pct(p.count, totalCasos)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Por departamento ────────────────────────────────────────────── */}
      {(data.por_departamento ?? []).length > 0 && (
        <Card>
          <SectionTitle>Por departamento / región (top 20)</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.por_departamento.map(({ departamento, count }) => (
              <HBar key={departamento} label={departamento} count={count} max={maxDept} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Por país ────────────────────────────────────────────────────── */}
      {data.por_pais.length > 0 && (
        <Card>
          <SectionTitle>Por país</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {data.por_pais.sort((a, b) => b.count - a.count).map(({ pais_codigo, count }) => (
              <div key={pais_codigo} className="rounded-xl px-4 py-2 text-sm" style={{ background: '#f2f4f4' }}>
                <span className="font-semibold" style={{ color: '#191c1d' }}>{count}</span>
                <span className="ml-1.5" style={{ color: '#6e7976' }}>{PAIS_LABELS[pais_codigo] ?? pais_codigo}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Heatmap médico × mes ────────────────────────────────────────── */}
      {(data.heatmap_medico_mes ?? []).length > 0 && (
        <Card>
          <SectionTitle>Actividad por médico y mes — top 10 (últimos 12 meses)</SectionTitle>
          <HeatmapGrid cells={data.heatmap_medico_mes} />
        </Card>
      )}

      {/* ── Tabla de médicos ────────────────────────────────────────────── */}
      {(data.por_medico ?? []).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#191c1d' }}>
              Desempeño por médico — {data.por_medico.length} médicos
            </h2>
            <p className="text-[10px]" style={{ color: '#9eaaa7' }}>Haz clic en un encabezado para ordenar</p>
          </div>
          <MedicoTable medicos={data.por_medico} />
        </Card>
      )}

      {/* ── Casos recientes ─────────────────────────────────────────────── */}
      {data.casos_recientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e0e8e5] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e8e5]">
            <h2 className="text-sm font-semibold" style={{ color: '#191c1d' }}>Casos recientes</h2>
            <Link href="/dx/casos" className="text-xs font-medium hover:underline" style={{ color: BRAND }}>
              Ver todos
            </Link>
          </div>
          <RecentTable casos={data.casos_recientes} />
        </div>
      )}

    </div>
  );
}
