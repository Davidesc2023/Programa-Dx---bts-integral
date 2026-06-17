'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Filter, X, ChevronDown, RefreshCw, AlertTriangle, Users, TrendingUp, CheckCircle2, Clock, Dna, FlaskConical } from 'lucide-react';
import { getDxDashboard, type DashboardFilters } from '@/services/admin-dx.service';
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
  DxMedicoLista,
} from '@/types/dx.types';

// ─── Paleta de colores (brand) ────────────────────────────────────────────────

const BRAND  = '#316358';
const YELLOW = '#f3e159';
const BLUE   = '#3977e9';

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
  NO_ACEPTO:                     '#e74c3c',
  PROGRAMADO:                    BLUE,
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
  PROGRAMADO:             BLUE,
  SIN_INDICACION_GENETICA:'#6b7280',
  NO_ACEPTA:              '#e74c3c',
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
  POSITIVO:       '#e74c3c',
  EN_TRATAMIENTO: BRAND,
  FORMULADO:      BLUE,
  TRASPLANTADO:   '#7c3aed',
  DROP_OUT:       '#6b7280',
  FALLECIDO:      '#374151',
};

const PROGRAMA_COLOR: Record<string, string> = {
  WILSON:   BRAND,
  DAAT:     BLUE,
  DUCHENNE: '#9333ea',
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

const PAISES = ['CO', 'EC', 'PA', 'CL', 'CR', 'SV', 'DO', 'GT'];

// ─── Utilidades ───────────────────────────────────────────────────────────────

function pct(num: number, den: number) {
  if (!den) return '0%';
  return `${Math.round((num / den) * 100)}%`;
}

function shortMes(mes: string) {
  const [y, m] = mes.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

// ─── Primitivos UI ────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`} style={{ borderColor: '#dde8e5' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold" style={{ color: '#0d1a17' }}>{children}</h2>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#8ea8a4' }}>{sub}</p>}
    </div>
  );
}

function MetricCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: number | string; sub?: string;
  color?: string; icon?: React.ElementType;
}) {
  const c = color ?? BRAND;
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ background: `${c}08`, borderColor: `${c}22` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: `${c}aa` }}>{label}</p>
        {Icon && <Icon size={16} style={{ color: `${c}88` }} />}
      </div>
      <p className="text-3xl font-black leading-none" style={{ color: c }}>{value}</p>
      {sub && <p className="text-[11px]" style={{ color: '#8ea8a4' }}>{sub}</p>}
    </div>
  );
}

function HBar({ label, count, max, color = BRAND }: {
  label: string; count: number; max: number; color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-40 truncate shrink-0" style={{ color: '#2a4a45' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#eef3f2' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(count / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color: '#0d1a17' }}>{count}</span>
    </div>
  );
}

// ─── Barra de filtros ─────────────────────────────────────────────────────────

interface FilterBarProps {
  filters:   DashboardFilters;
  medicos:   DxMedicoLista[];
  anos:      string[];
  onChange:  (f: DashboardFilters) => void;
  onClear:   () => void;
  isLoading: boolean;
}

function FilterBar({ filters, medicos, anos, onChange, onClear, isLoading }: FilterBarProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  function set(key: keyof DashboardFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  const selectClass = "text-xs font-medium border rounded-xl px-3 h-9 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all appearance-none pr-7";
  const selectStyle = { borderColor: '#dde8e5', color: '#0d1a17', backgroundImage: 'none' };

  return (
    <div
      className="rounded-2xl border p-4 flex flex-wrap items-center gap-3"
      style={{ background: '#f8fcfa', borderColor: '#dde8e5' }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Filter size={14} style={{ color: BRAND }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>Filtros</span>
        {activeCount > 0 && (
          <span
            className="text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{ background: YELLOW, color: '#0d1a17' }}
          >
            {activeCount}
          </span>
        )}
      </div>

      {/* Programa */}
      <div className="relative">
        <select className={selectClass} style={selectStyle} value={filters.programa ?? ''} onChange={(e) => set('programa', e.target.value)}>
          <option value="">Todos los programas</option>
          <option value="WILSON">Wilson</option>
          <option value="DAAT">DAAT (Alfa-1)</option>
          <option value="DUCHENNE">Duchenne</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ea8a4' }} />
      </div>

      {/* País */}
      <div className="relative">
        <select className={selectClass} style={selectStyle} value={filters.pais ?? ''} onChange={(e) => set('pais', e.target.value)}>
          <option value="">Todos los países</option>
          {PAISES.map((p) => <option key={p} value={p}>{PAIS_LABELS[p] ?? p}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ea8a4' }} />
      </div>

      {/* Año */}
      <div className="relative">
        <select className={selectClass} style={selectStyle} value={filters.ano ?? ''} onChange={(e) => set('ano', e.target.value)}>
          <option value="">Todos los años</option>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ea8a4' }} />
      </div>

      {/* Estado */}
      <div className="relative">
        <select className={selectClass} style={selectStyle} value={filters.estado ?? ''} onChange={(e) => set('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ea8a4' }} />
      </div>

      {/* Médico */}
      <div className="relative">
        <select className={selectClass} style={{ ...selectStyle, minWidth: 180 }} value={filters.medico ?? ''} onChange={(e) => set('medico', e.target.value)}>
          <option value="">Todos los médicos</option>
          {medicos.map((m) => <option key={m.email} value={m.email}>{m.nombre}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ea8a4' }} />
      </div>

      {/* Limpiar + refresh */}
      <div className="flex items-center gap-2 ml-auto">
        {isLoading && <RefreshCw size={14} className="animate-spin" style={{ color: BRAND }} />}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 h-9 transition-colors hover:bg-red-50"
            style={{ color: '#e74c3c', border: '1px solid #fca5a5' }}
          >
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Embudo de conversión ─────────────────────────────────────────────────────

function ConversionFunnel({ f }: { f: DxConversionFunnel }) {
  const steps = [
    { label: 'Total solicitudes',      value: f.total,               color: '#6b7280', icon: Users },
    { label: 'Paciente autorizó',       value: f.autorizados,         color: '#16a34a', icon: CheckCircle2 },
    { label: 'Muestra tomada',          value: f.muestra_tomada,      color: BLUE,       icon: FlaskConical },
    { label: 'Resultado sérico',        value: f.con_resultado_serico, color: '#0891b2', icon: TrendingUp },
    { label: 'Con indicación genética', value: f.con_indicacion,      color: '#65a30d', icon: Dna },
    { label: 'Genética realizada',      value: f.genetica_realizada,  color: '#7c3aed', icon: Dna },
    { label: 'Completados',             value: f.completados,         color: BRAND,      icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const w = f.total > 0 ? (s.value / f.total) * 100 : 0;
        const Icon = s.icon;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Icon size={12} style={{ color: s.color }} />
                <span className="text-xs font-medium" style={{ color: '#2a4a45' }}>{s.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: '#0d1a17' }}>
                {s.value}
                {i > 0 && (
                  <span className="font-normal ml-1.5 text-[11px]" style={{ color: '#8ea8a4' }}>
                    ({pct(s.value, f.total)})
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#eef3f2' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${w}%`, background: s.color }}
              />
            </div>
          </div>
        );
      })}

      {f.no_acepto > 0 && (
        <div className="flex items-center gap-2 pt-1.5 border-t" style={{ borderColor: '#eef3f2' }}>
          <AlertTriangle size={12} style={{ color: '#e74c3c' }} />
          <p className="text-xs" style={{ color: '#e74c3c' }}>
            No aceptaron: <strong>{f.no_acepto}</strong> ({pct(f.no_acepto, f.total)})
          </p>
        </div>
      )}

      <div className="pt-2 border-t grid grid-cols-2 gap-3 text-xs" style={{ borderColor: '#eef3f2' }}>
        <div className="rounded-xl p-2.5" style={{ background: `${BRAND}08` }}>
          <p className="text-[10px] mb-0.5" style={{ color: '#8ea8a4' }}>Tasa sérico→genética</p>
          <p className="font-black text-base" style={{ color: BRAND }}>
            {pct(f.con_indicacion, f.con_indicacion + f.sin_indicacion)}
          </p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: '#6b728008' }}>
          <p className="text-[10px] mb-0.5" style={{ color: '#8ea8a4' }}>Sin indicación</p>
          <p className="font-black text-base" style={{ color: '#6b7280' }}>
            {f.sin_indicacion}
            <span className="text-xs font-normal ml-1">({pct(f.sin_indicacion, f.con_resultado_serico)})</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Gráfica temporal agrupada ────────────────────────────────────────────────

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
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: h, background: PROGRAMA_COLOR[prog] ?? '#ccc', opacity: count === 0 ? 0.15 : 1 }}
                      title={`${PROGRAMA_LABELS[prog] ?? prog}: ${count}`}
                    />
                    {count > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 mb-1">
                        {PROGRAMA_LABELS[prog] ?? prog}: {count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-[9px] text-center" style={{ color: '#8ea8a4' }}>{shortMes(mes)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        {programas.map(p => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PROGRAMA_COLOR[p] ?? '#ccc' }} />
            <span className="text-xs" style={{ color: '#6e8f8a' }}>{PROGRAMA_LABELS[p] ?? p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap médico × mes ─────────────────────────────────────────────────────

function HeatmapGrid({ cells }: { cells: DxHeatmapCell[] }) {
  const doctores = Array.from(new Map(cells.map(c => [c.medico_email, c.medico_nombre])).entries())
    .map(([email, nombre]) => ({ email, nombre }));
  const meses = Array.from(new Set(cells.map(c => c.mes))).sort().slice(-12);
  const maxVal = Math.max(...cells.map(c => c.count), 1);
  const lookup = new Map(cells.map(c => [`${c.medico_email}::${c.mes}`, c.count]));

  function heatColor(count: number) {
    if (!count) return '#eef3f2';
    const intensity = count / maxVal;
    const r = Math.round(232 - intensity * (232 - 49));
    const g = Math.round(245 - intensity * (245 - 99));
    const b = Math.round(242 - intensity * (242 - 88));
    return `rgb(${r},${g},${b})`;
  }

  if (!doctores.length || !meses.length) {
    return <p className="text-xs" style={{ color: '#8ea8a4' }}>Sin datos suficientes para el heatmap.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left pr-2 font-normal w-28" style={{ color: '#8ea8a4' }}>Médico</th>
            {meses.map(m => (
              <th key={m} className="font-normal text-center" style={{ color: '#8ea8a4', minWidth: 32 }}>
                {shortMes(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doctores.map(({ email, nombre }) => (
            <tr key={email}>
              <td className="pr-2 truncate max-w-[112px]" style={{ color: '#2a4a45' }} title={nombre}>
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
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px]" style={{ color: '#8ea8a4' }}>0</span>
        <div className="flex">
          {[0, 0.15, 0.3, 0.5, 0.7, 1].map(t => (
            <div key={t} style={{ width: 20, height: 10, background: heatColor(Math.round(t * maxVal)) }} />
          ))}
        </div>
        <span className="text-[10px]" style={{ color: '#8ea8a4' }}>{maxVal}</span>
      </div>
    </div>
  );
}

// ─── Vista 360° del paciente ──────────────────────────────────────────────────

function Vista360({ f, seguimiento, estadoGen }: {
  f: DxConversionFunnel;
  seguimiento: DxSeguimientoCount[];
  estadoGen: DxEstadoGeneticoCount[];
}) {
  const etapas = [
    {
      num: 1,
      label: 'Orden médica',
      desc: 'Médico crea solicitud vía formulario público',
      valor: f.total,
      color: '#6b7280',
      icon: Users,
    },
    {
      num: 2,
      label: 'Autorización del paciente',
      desc: `${f.autorizados} autorizaron · ${f.no_acepto} no aceptaron`,
      valor: f.autorizados,
      color: '#16a34a',
      icon: CheckCircle2,
    },
    {
      num: 3,
      label: 'Toma de muestra',
      desc: 'Paciente programado y muestra recolectada',
      valor: f.muestra_tomada,
      color: BLUE,
      icon: FlaskConical,
    },
    {
      num: 4,
      label: 'Resultado sérico',
      desc: 'Análisis de nivel en sangre completado',
      valor: f.con_resultado_serico,
      color: '#0891b2',
      icon: TrendingUp,
    },
    {
      num: 5,
      label: 'Indicación genética',
      desc: `Con indicación: ${f.con_indicacion} · Sin indicación: ${f.sin_indicacion}`,
      valor: f.con_indicacion + f.sin_indicacion,
      color: '#65a30d',
      icon: Dna,
    },
    {
      num: 6,
      label: 'Prueba genética',
      desc: 'Muestra enviada a laboratorio genético',
      valor: f.genetica_realizada,
      color: '#7c3aed',
      icon: Dna,
    },
    {
      num: 7,
      label: 'Resultado final',
      desc: 'Resultado genético disponible y caso cerrado',
      valor: f.completados,
      color: BRAND,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-0">
      {etapas.map((e, idx) => {
        const prev = idx === 0 ? f.total : etapas[idx - 1].valor;
        const drop = prev - e.valor;
        const dropPct = prev > 0 ? Math.round((drop / prev) * 100) : 0;
        const Icon = e.icon;

        return (
          <div key={e.num} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: `${e.color}18`, color: e.color, border: `2px solid ${e.color}33` }}
              >
                {e.num}
              </div>
              {idx < etapas.length - 1 && (
                <div className="w-px flex-1 min-h-[32px] my-1" style={{ background: '#dde8e5' }} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 ${idx < etapas.length - 1 ? '' : ''}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <Icon size={13} style={{ color: e.color }} />
                <span className="text-xs font-bold" style={{ color: '#0d1a17' }}>{e.label}</span>
                <span
                  className="text-[11px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${e.color}14`, color: e.color }}
                >
                  {e.valor}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#6e8f8a' }}>{e.desc}</p>
              {idx > 0 && drop > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: '#e74c3c' }}>
                  ↓ {drop} pacientes no continuaron ({dropPct}%)
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Seguimiento clínico */}
      {seguimiento.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#dde8e5' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#0d1a17' }}>Seguimiento clínico de completados</p>
          <div className="grid grid-cols-2 gap-2">
            {seguimiento.map(({ seguimiento_clinico, count }) => (
              <div
                key={seguimiento_clinico}
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ background: `${SEGUIMIENTO_COLOR[seguimiento_clinico] ?? '#6b7280'}0d` }}
              >
                <span className="text-xs font-medium" style={{ color: '#2a4a45' }}>
                  {SEGUIMIENTO_LABELS[seguimiento_clinico] ?? seguimiento_clinico}
                </span>
                <span className="text-xs font-black" style={{ color: SEGUIMIENTO_COLOR[seguimiento_clinico] ?? '#6b7280' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado prueba genética */}
      {estadoGen.filter(e => e.estado_genetico !== 'N_A').length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#dde8e5' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#0d1a17' }}>Estado prueba genética</p>
          <div className="space-y-2">
            {estadoGen
              .filter(e => e.estado_genetico !== 'N_A' && e.count > 0)
              .map(({ estado_genetico, count }) => {
                const max = Math.max(...estadoGen.map(e => e.count), 1);
                return (
                  <HBar
                    key={estado_genetico}
                    label={ESTADO_GEN_LABELS[estado_genetico] ?? estado_genetico}
                    count={count}
                    max={max}
                    color={ESTADO_GEN_COLOR[estado_genetico] ?? '#6b7280'}
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tabla de médicos ─────────────────────────────────────────────────────────

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
    { key: 'pendientes',     label: 'Pend.',    title: 'Pendientes sin acción' },
    { key: 'en_proceso',     label: 'En proc.', title: 'En proceso activo' },
    { key: 'sin_indicacion', label: 'Sin ind.', title: 'Sin indicación genética' },
    { key: 'con_indicacion', label: 'Con ind.', title: 'Con indicación genética' },
    { key: 'positivos',      label: 'Pos.',     title: 'Seguimiento positivo' },
    { key: 'negativos',      label: 'Neg.',     title: 'Seguimiento negativo' },
    { key: 'no_acepto',      label: 'No acep.', title: 'No aceptaron' },
    { key: 'completados',    label: 'Comp.',    title: 'Completados' },
    { key: 'tasa_conversion', label: '% Conv.', title: '% Conversión sérica→genética' },
    { key: 'tasa_completado', label: '% Comp.', title: '% Tasa de completado' },
  ];

  const Th = ({ col }: { col: typeof cols[0] }) => (
    <th
      className="px-2 py-2 text-right text-[10px] font-semibold cursor-pointer select-none whitespace-nowrap"
      style={{ color: sortBy === col.key ? BRAND : '#8ea8a4' }}
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
          <tr style={{ borderBottom: '2px solid #dde8e5' }}>
            <th className="px-3 py-2 text-left text-[10px] font-semibold" style={{ color: '#8ea8a4' }}>Médico</th>
            {cols.map(c => <Th key={c.key} col={c} />)}
          </tr>
        </thead>
        <tbody>
          {sorted.map(m => (
            <tr key={m.medico_email} className="hover:bg-[#f8fcfa]" style={{ borderBottom: '1px solid #eef3f2' }}>
              <td className="px-3 py-2.5 max-w-[180px]">
                <div className="font-medium truncate" style={{ color: '#0d1a17' }}>{m.medico_nombre}</div>
                <div className="text-[10px] truncate" style={{ color: '#8ea8a4' }}>{m.medico_email}</div>
              </td>
              {cols.map(c => {
                const v = m[c.key] as number;
                const isPct = c.key === 'tasa_conversion' || c.key === 'tasa_completado';
                const hilight = (c.key === 'positivos' && v > 0) ? '#e74c3c'
                  : (c.key === 'no_acepto' && v > 0) ? '#d97706'
                  : (c.key === 'tasa_conversion' || c.key === 'completados') ? BRAND
                  : '#0d1a17';
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

// ─── Tabla de casos recientes ─────────────────────────────────────────────────

function RecentTable({ casos }: { casos: DxCasoItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid #dde8e5' }}>
            {['Consecutivo','Paciente','Médico','Programa','Estado',''].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: '#8ea8a4' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {casos.map(c => (
            <tr key={c.id} className="hover:bg-[#f8fcfa]" style={{ borderBottom: '1px solid #eef3f2' }}>
              <td className="px-3 py-3 font-mono text-xs font-bold" style={{ color: BRAND }}>{c.consecutivo}</td>
              <td className="px-3 py-3 text-xs" style={{ color: '#0d1a17' }}>{c.paciente_iniciales}</td>
              <td className="px-3 py-3 text-xs truncate max-w-[140px]" style={{ color: '#2a4a45' }}>{c.medico_nombre}</td>
              <td className="px-3 py-3 text-xs" style={{ color: '#6e8f8a' }}>
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
                <Link href={`/dx/casos/${c.id}`} className="text-xs font-semibold hover:underline" style={{ color: BRAND }}>
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function DxDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dx-dashboard', filters],
    queryFn: () => getDxDashboard(filters),
    staleTime: 60_000,
    retry: 1,
  });

  const handleFilterChange = useCallback((f: DashboardFilters) => {
    setFilters(f);
  }, []);

  const handleClear = useCallback(() => setFilters({}), []);

  // Años disponibles derivados de los datos
  const anosDisponibles = useMemo(() => {
    if (!data?.por_ano) return [];
    return data.por_ano.map(a => a.ano).sort((a, b) => b.localeCompare(a));
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: '#dde8e5' }} />
        <div className="h-16 rounded-2xl animate-pulse" style={{ background: '#dde8e5' }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#dde8e5' }} />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#dde8e5' }} />
      </div>
    );
  }

  if (isError || !data) {
    const isAuthError = (error as { response?: { status?: number } })?.response?.status === 401;
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <AlertTriangle size={40} style={{ color: '#d97706' }} />
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: '#0d1a17' }}>
            {isAuthError ? 'Sesión expirada' : 'Error al cargar el dashboard'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8ea8a4' }}>
            {isAuthError
              ? 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.'
              : 'Verifica la conexión con el servidor o recarga la página.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
          style={{ background: `${BRAND}14`, color: BRAND }}
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  // ── Métricas derivadas ────────────────────────────────────────────────────
  const totalCasos  = data.por_estado.reduce((s, e) => s + e.count, 0);
  const completados = data.por_estado.find(e => e.estado === 'COMPLETADO')?.count ?? 0;
  const f           = data.conversion_funnel ?? {} as DxConversionFunnel;
  const tasaConv    = (f.con_indicacion + f.sin_indicacion) > 0
    ? Math.round((f.con_indicacion / (f.con_indicacion + f.sin_indicacion)) * 100)
    : 0;
  const tasaComp    = totalCasos ? Math.round((completados / totalCasos) * 100) : 0;
  const auth        = data.tasa_autorizacion ?? { autorizado: 0, no_autorizado: 0, pendiente: 0 };
  const totalAuth   = auth.autorizado + auth.no_autorizado + auth.pendiente;
  const tasaAuth    = totalAuth ? Math.round((auth.autorizado / totalAuth) * 100) : 0;
  const maxDept     = Math.max(...(data.por_departamento ?? []).map(d => d.count), 1);
  const maxEst      = Math.max(...data.por_estado.map(e => e.count), 1);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">

      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#0d1a17' }}>Panel DX — Analytics</h1>
          <p className="text-sm mt-1" style={{ color: '#6e8f8a' }}>
            Seguimiento integral del programa de diagnóstico genético
            {hasFilters && (
              <span className="ml-2 text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: YELLOW, color: '#0d1a17' }}>
                Filtros activos
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 transition-colors"
          style={{ background: `${BRAND}0d`, color: BRAND }}
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* ── Barra de filtros ─────────────────────────────────────────────── */}
      <FilterBar
        filters={filters}
        medicos={data.medicos_lista ?? []}
        anos={anosDisponibles}
        onChange={handleFilterChange}
        onClear={handleClear}
        isLoading={isLoading}
      />

      {/* ── KPIs principales ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Total casos"           value={totalCasos}                        color={BRAND}    icon={Users} />
        <MetricCard label="Pend. autorización"    value={data.pendientes_autorizacion}       color={data.pendientes_autorizacion > 0 ? '#d97706' : '#6b7280'} icon={Clock} />
        <MetricCard label="Con ind. genética"     value={f.con_indicacion ?? 0}              color="#65a30d"  icon={Dna} />
        <MetricCard label="Completados"           value={completados}                        color={BRAND}    sub={`${tasaComp}% del total`} icon={CheckCircle2} />
        <MetricCard label="% Conversión sérica"   value={`${tasaConv}%`}                    color={BLUE}     sub="sérico → genética" icon={TrendingUp} />
        <MetricCard label="% Autorización"        value={`${tasaAuth}%`}                    color="#16a34a"  sub={`${auth.no_autorizado} no autorizaron`} icon={CheckCircle2} />
      </div>

      {/* ── Tendencia temporal + embudo ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle sub="Últimos 12 meses">Solicitudes por mes y programa</SectionTitle>
          {(data.por_mes_programa ?? []).length > 0
            ? <GroupedMonthChart items={data.por_mes_programa} />
            : <p className="text-xs" style={{ color: '#8ea8a4' }}>Sin datos temporales.</p>
          }
        </Card>
        <Card>
          <SectionTitle sub="Porcentaje de conversión en cada etapa">Embudo de conversión clínica</SectionTitle>
          {f.total > 0
            ? <ConversionFunnel f={f} />
            : <p className="text-xs" style={{ color: '#8ea8a4' }}>Sin datos.</p>
          }
        </Card>
      </div>

      {/* ── Vista 360° del paciente ─────────────────────────────────────── */}
      <Card>
        <SectionTitle sub="Journey completo desde la orden médica hasta el resultado genético">
          Vista 360° del paciente
        </SectionTitle>
        {f.total > 0 ? (
          <Vista360
            f={f}
            seguimiento={data.seguimiento_dist ?? []}
            estadoGen={data.estado_genetico_dist ?? []}
          />
        ) : (
          <p className="text-xs" style={{ color: '#8ea8a4' }}>Sin casos registrados.</p>
        )}
      </Card>

      {/* ── Distribución estados ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* Autorización + Por año */}
        <div className="space-y-4">
          <Card>
            <SectionTitle>Autorización del paciente</SectionTitle>
            <div className="space-y-3">
              {[
                { label: 'Autorizó',    value: auth.autorizado,    color: '#16a34a' },
                { label: 'No autorizó', value: auth.no_autorizado, color: '#e74c3c' },
                { label: 'Pendiente',   value: auth.pendiente,     color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs" style={{ color: '#2a4a45' }}>{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color }}>{value}</span>
                    <span className="text-xs ml-1" style={{ color: '#8ea8a4' }}>{pct(value, totalAuth)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Por programa</SectionTitle>
            <div className="space-y-3">
              {data.por_programa.map(p => (
                <div key={p.codigo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PROGRAMA_COLOR[p.codigo] ?? '#ccc' }} />
                    <span className="text-xs" style={{ color: '#2a4a45' }}>{PROGRAMA_LABELS[p.codigo] ?? p.codigo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: '#0d1a17' }}>{p.count}</span>
                    <span className="text-xs ml-1" style={{ color: '#8ea8a4' }}>{pct(p.count, totalCasos)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Por país ─────────────────────────────────────────────────────── */}
      {data.por_pais.length > 0 && (
        <Card>
          <SectionTitle>Solicitudes por país</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {data.por_pais.sort((a, b) => b.count - a.count).map(({ pais_codigo, count }) => (
              <div
                key={pais_codigo}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                style={{ background: '#eef3f2', border: '1px solid #dde8e5' }}
              >
                <span className="text-lg font-black" style={{ color: BRAND }}>{count}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#0d1a17' }}>{PAIS_LABELS[pais_codigo] ?? pais_codigo}</p>
                  <p className="text-[10px]" style={{ color: '#8ea8a4' }}>{pais_codigo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Por año ──────────────────────────────────────────────────────── */}
      {(data.por_ano ?? []).length > 0 && (
        <Card>
          <SectionTitle>Solicitudes por año</SectionTitle>
          <div className="flex items-end gap-4 h-24 pt-2">
            {data.por_ano.map(({ ano, count }) => {
              const maxAno = Math.max(...data.por_ano.map(a => a.count), 1);
              return (
                <div key={ano} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-sm font-black" style={{ color: '#0d1a17' }}>{count}</span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{ height: Math.max(4, (count / maxAno) * 56), background: BRAND, opacity: 0.85 }}
                  />
                  <span className="text-xs font-semibold" style={{ color: '#6e8f8a' }}>{ano}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Por departamento ─────────────────────────────────────────────── */}
      {(data.por_departamento ?? []).length > 0 && (
        <Card>
          <SectionTitle sub="Top 20 regiones/departamentos">Por departamento / región</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.por_departamento.map(({ departamento, count }) => (
              <HBar key={departamento} label={departamento} count={count} max={maxDept} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Heatmap médico × mes ─────────────────────────────────────────── */}
      {(data.heatmap_medico_mes ?? []).length > 0 && (
        <Card>
          <SectionTitle sub="Top 10 médicos — últimos 12 meses">Actividad por médico y mes</SectionTitle>
          <HeatmapGrid cells={data.heatmap_medico_mes} />
        </Card>
      )}

      {/* ── Tabla de médicos ─────────────────────────────────────────────── */}
      {(data.por_medico ?? []).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#0d1a17' }}>
                Desempeño por médico — {data.por_medico.length} médicos
              </h2>
              <p className="text-[10px] mt-0.5" style={{ color: '#8ea8a4' }}>Haz clic en un encabezado para ordenar</p>
            </div>
          </div>
          <MedicoTable medicos={data.por_medico} />
        </Card>
      )}

      {/* ── Casos recientes ──────────────────────────────────────────────── */}
      {data.casos_recientes.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#dde8e5' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#dde8e5' }}>
            <h2 className="text-sm font-bold" style={{ color: '#0d1a17' }}>Casos recientes</h2>
            <Link href="/dx/casos" className="text-xs font-semibold hover:underline" style={{ color: BRAND }}>
              Ver todos →
            </Link>
          </div>
          <RecentTable casos={data.casos_recientes} />
        </div>
      )}

    </div>
  );
}
