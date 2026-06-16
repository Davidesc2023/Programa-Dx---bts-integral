'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getCaso, cambiarEstado, registrarSerica, setIndicacion,
  registrarGenetica, registrarSeguimiento,
  generarLinkPaciente, invalidarLinkPaciente, eliminarCaso,
  getDxError,
} from '@/services/admin-dx.service';
import type { DxCasoDetalle, DxAuditEntry } from '@/types/dx.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_LABELS: Record<string, string> = {
  SOLICITUD_RECIBIDA: 'Solicitud recibida', EN_PROGRAMACION: 'En programación',
  PENDIENTE_AUTORIZACION: 'Pendiente autorización', AUTORIZADO: 'Autorizado',
  PROGRAMADO: 'Programado', MUESTRA_TOMADA: 'Muestra tomada',
  RESULTADO_SERICO_DISPONIBLE: 'Resultado sérico disp.', CON_INDICACION_GENETICA: 'Con indicación genética',
  SIN_INDICACION_GENETICA: 'Sin indicación genética', GENETICA_PROGRAMADA: 'Genética programada',
  GENETICA_EN_PROCESAMIENTO: 'Genética en proceso', GENETICA_RESULTADO_DISPONIBLE: 'Resultado genético disp.',
  COMPLETADO: 'Completado', NO_ACEPTO: 'No aceptó', SIN_CONTACTO_EFECTIVO: 'Sin contacto efectivo',
  CANCELADO: 'Cancelado', FALLECIDO: 'Fallecido', DATOS_INCOMPLETOS: 'Datos incompletos',
};

const ESTADO_COLOR: Record<string, string> = {
  SOLICITUD_RECIBIDA: '#6b7280', EN_PROGRAMACION: '#d97706', PENDIENTE_AUTORIZACION: '#f59e0b',
  AUTORIZADO: '#16a34a', PROGRAMADO: '#2563eb', MUESTRA_TOMADA: '#7c3aed',
  RESULTADO_SERICO_DISPONIBLE: '#0891b2', CON_INDICACION_GENETICA: '#65a30d',
  SIN_INDICACION_GENETICA: '#1B7A6B', COMPLETADO: '#1B7A6B', NO_ACEPTO: '#ba1a1a',
  SIN_CONTACTO_EFECTIVO: '#d97706', CANCELADO: '#9ca3af', FALLECIDO: '#374151',
  GENETICA_PROGRAMADA: '#4f46e5', GENETICA_EN_PROCESAMIENTO: '#7c3aed',
  GENETICA_RESULTADO_DISPONIBLE: '#9333ea', DATOS_INCOMPLETOS: '#9a3412',
};

const ESTADOS_TERMINALES = new Set(['COMPLETADO', 'CANCELADO', 'FALLECIDO', 'NO_ACEPTO']);

const TRANSICIONES: Record<string, string[]> = {
  SOLICITUD_RECIBIDA: ['EN_PROGRAMACION', 'CANCELADO', 'FALLECIDO'],
  EN_PROGRAMACION: ['PENDIENTE_AUTORIZACION', 'SIN_CONTACTO_EFECTIVO', 'CANCELADO', 'FALLECIDO'],
  PENDIENTE_AUTORIZACION: ['AUTORIZADO', 'NO_ACEPTO', 'FALLECIDO'],
  AUTORIZADO: ['PROGRAMADO', 'CANCELADO', 'FALLECIDO'],
  PROGRAMADO: ['MUESTRA_TOMADA', 'CANCELADO', 'FALLECIDO'],
  MUESTRA_TOMADA: ['RESULTADO_SERICO_DISPONIBLE', 'FALLECIDO'],
  RESULTADO_SERICO_DISPONIBLE: ['CON_INDICACION_GENETICA', 'SIN_INDICACION_GENETICA', 'FALLECIDO'],
  CON_INDICACION_GENETICA: ['GENETICA_PROGRAMADA', 'FALLECIDO'],
  SIN_INDICACION_GENETICA: ['COMPLETADO', 'FALLECIDO'],
  GENETICA_PROGRAMADA: ['GENETICA_EN_PROCESAMIENTO', 'FALLECIDO'],
  GENETICA_EN_PROCESAMIENTO: ['GENETICA_RESULTADO_DISPONIBLE', 'FALLECIDO'],
  GENETICA_RESULTADO_DISPONIBLE: ['COMPLETADO', 'FALLECIDO'],
  SIN_CONTACTO_EFECTIVO: ['EN_PROGRAMACION', 'CANCELADO', 'FALLECIDO'],
  DATOS_INCOMPLETOS: ['EN_PROGRAMACION', 'CANCELADO', 'FALLECIDO'],
};

const ESTADOS_GENETICO = ['PROGRAMADO', 'EN_PROCESAMIENTO', 'REALIZADO', 'SIN_INDICACION_GENETICA', 'N_A', 'NO_ACEPTA'];
const ESTADOS_SEGUIMIENTO = ['NEGATIVO', 'PORTADOR', 'POSITIVO', 'EN_TRATAMIENTO', 'FORMULADO', 'TRASPLANTADO', 'DROP_OUT', 'FALLECIDO', 'N_A'];
const PAIS_LABELS: Record<string, string> = {
  CO: 'Colombia', EC: 'Ecuador', PA: 'Panamá', CL: 'Chile',
  CR: 'Costa Rica', SV: 'El Salvador', DO: 'Rep. Dominicana', GT: 'Guatemala',
};

// ─── Reusable primitives ──────────────────────────────────────────────────────

function Badge({ estado }: { estado: string }) {
  const color = ESTADO_COLOR[estado] ?? '#6b7280';
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: '#9eaaa7' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: '#191c1d' }}>{value}</p>
    </div>
  );
}

function SectionCard({
  title, children, collapsible = false, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-[#e0e8e5] overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? '1px solid #f2f4f4' : 'none' }}
        onClick={() => collapsible && setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold" style={{ color: '#191c1d' }}>{title}</span>
        {collapsible && (
          open ? <ChevronUp size={16} style={{ color: '#9eaaa7' }} />
               : <ChevronDown size={16} style={{ color: '#9eaaa7' }} />
        )}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

const selectCls = 'w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(27,122,107,0.20)]';
const selectStyle = { background: '#f2f4f4', border: '1px solid #bec9c5', color: '#191c1d' };

// ─── Section: Estado ──────────────────────────────────────────────────────────

function EstadoSection({ caso, onMutate }: { caso: DxCasoDetalle; onMutate: () => void }) {
  const [nextEstado, setNextEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const validNext = TRANSICIONES[caso.estado] ?? [];
  const isTerminal = ESTADOS_TERMINALES.has(caso.estado);

  const handleSave = async () => {
    if (!nextEstado) return;
    setSaving(true);
    try {
      await cambiarEstado(caso.id, { estado: nextEstado, motivo: motivo || undefined });
      toast.success(`Estado cambiado a: ${ESTADO_LABELS[nextEstado] ?? nextEstado}`);
      setNextEstado(''); setMotivo('');
      onMutate();
    } catch (err) {
      toast.error(getDxError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Estado del caso">
      <div className="flex items-center gap-3 mb-4">
        <Badge estado={caso.estado} />
        <span className="text-xs" style={{ color: '#9eaaa7' }}>
          Actualizado {new Date(caso.updated_at ?? caso.created_at).toLocaleDateString('es-CO')}
        </span>
      </div>

      {isTerminal ? (
        <p className="text-xs" style={{ color: '#9eaaa7' }}>Estado terminal — sin transiciones disponibles.</p>
      ) : validNext.length === 0 ? (
        <p className="text-xs" style={{ color: '#9eaaa7' }}>No hay transiciones disponibles desde este estado.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Cambiar estado a</label>
            <select className={selectCls} style={selectStyle} value={nextEstado} onChange={(e) => setNextEstado(e.target.value)}>
              <option value="">Seleccione…</option>
              {validNext.map((e) => (
                <option key={e} value={e}>{ESTADO_LABELS[e] ?? e}</option>
              ))}
            </select>
          </div>
          {nextEstado && (
            <Input
              label="Motivo / observación (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          )}
          <Button size="sm" disabled={!nextEstado || saving} loading={saving} onClick={handleSave}>
            Confirmar cambio
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section: Link paciente ───────────────────────────────────────────────────

function LinkPacienteSection({ caso, onMutate }: { caso: DxCasoDetalle; onMutate: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  const [expira, setExpira] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [invLoading, setInvLoading] = useState(false);

  const canGenerate = ['SOLICITUD_RECIBIDA', 'EN_PROGRAMACION', 'PENDIENTE_AUTORIZACION', 'NO_ACEPTO'].includes(caso.estado);

  const handleGenerar = async () => {
    setGenLoading(true);
    try {
      const res = await generarLinkPaciente(caso.id);
      setLink(res.url); setExpira(res.expira_at);
      toast.success('Link generado. Compártalo con el paciente.');
      onMutate();
    } catch (err) { toast.error(getDxError(err)); }
    finally { setGenLoading(false); }
  };

  const handleInvalidar = async () => {
    if (!confirm('¿Invalidar todos los links activos para este caso?')) return;
    setInvLoading(true);
    try {
      const res = await invalidarLinkPaciente(caso.id);
      toast.success(`${res.invalidados} link(s) invalidado(s).`);
      setLink(null); onMutate();
    } catch (err) { toast.error(getDxError(err)); }
    finally { setInvLoading(false); }
  };

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <SectionCard title="Autorización del paciente" collapsible defaultOpen>
      {caso.paciente_autorizacion ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge estado={caso.paciente_autorizacion === 'AUTORIZADO' ? 'AUTORIZADO' : 'NO_ACEPTO'} />
            {caso.paciente_autorizo_at && (
              <span className="text-xs" style={{ color: '#9eaaa7' }}>
                {new Date(caso.paciente_autorizo_at).toLocaleDateString('es-CO')}
              </span>
            )}
          </div>
          {caso.paciente_nombre_firmado && (
            <Field label="Firmado por" value={caso.paciente_nombre_firmado} />
          )}
          {caso.paciente_correccion_datos && (
            <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: '#fff7ed', color: '#9a3412' }}>
              <p className="font-semibold text-xs mb-1">Corrección solicitada:</p>
              {caso.paciente_correccion_datos}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs mb-3" style={{ color: '#9eaaa7' }}>Sin respuesta del paciente.</p>
      )}

      {link && (
        <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(27,122,107,0.06)', border: '1px solid rgba(27,122,107,0.2)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#1B7A6B' }}>
            Link generado · vence {expira ? new Date(expira).toLocaleString('es-CO') : ''}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex-1 text-xs truncate font-mono" style={{ color: '#1B7A6B' }}>{link}</span>
            <button type="button" onClick={copyLink} className="p-1.5 rounded-lg hover:bg-[rgba(27,122,107,0.1)]">
              {copied ? <Check size={14} style={{ color: '#1B7A6B' }} /> : <Copy size={14} style={{ color: '#1B7A6B' }} />}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-[rgba(27,122,107,0.1)]">
              <ExternalLink size={14} style={{ color: '#1B7A6B' }} />
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {canGenerate && (
          <Button size="sm" loading={genLoading} onClick={handleGenerar}>
            {link ? 'Regenerar link' : 'Generar link para paciente'}
          </Button>
        )}
        <Button size="sm" variant="outline" loading={invLoading} onClick={handleInvalidar}>
          Invalidar links activos
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Section: Resultado sérico ────────────────────────────────────────────────

function SericaSection({ caso, onMutate }: { caso: DxCasoDetalle; onMutate: () => void }) {
  const [open, setOpen] = useState(!caso.serica_registrada_at);
  const [v1, setV1] = useState(caso.resultado_serico_1 ?? '');
  const [v2, setV2] = useState(caso.resultado_serico_2 ?? '');
  const [interp, setInterp] = useState(caso.interpretacion_serico ?? '');
  const [notas, setNotas] = useState(caso.notas_serico ?? '');
  const [saving, setSaving] = useState(false);

  const codigo = caso.programas?.codigo;
  const field1 = codigo === 'DAAT' ? 'Alfa-1 antitripsina sérica (mg/dL)'
    : codigo === 'DUCHENNE' ? 'Creatina quinasa sérica CK (U/L)'
    : 'Ceruloplasmina sérica (mg/dL)';
  const field2 = codigo === 'WILSON' ? 'Cobre en orina 24h (µg/24h)' : null;

  const handleSave = async () => {
    if (!v1.trim()) { toast.error('El primer valor es requerido'); return; }
    setSaving(true);
    try {
      const res = await registrarSerica(caso.id, {
        resultado_serico_1: v1.trim(),
        resultado_serico_2: v2.trim() || undefined,
        interpretacion_serico: interp.trim() || undefined,
        notas_serico: notas.trim() || undefined,
      });
      const ind = res.indicacion;
      const msg = ind.resultado === null ? 'Resultado registrado. Indicación manual requerida.'
        : ind.resultado ? 'Resultado registrado. Sistema indica: CON indicación genética.'
        : 'Resultado registrado. Sistema indica: SIN indicación genética.';
      toast.success(msg);
      setOpen(false); onMutate();
    } catch (err) { toast.error(getDxError(err)); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard title="Resultado sérico" collapsible defaultOpen>
      {caso.serica_registrada_at && !open && (
        <div className="space-y-3 mb-3">
          <Field label={field1} value={caso.resultado_serico_1} />
          {campo2Show(caso) && <Field label={field2 ?? ''} value={caso.resultado_serico_2} />}
          <Field label="Interpretación" value={caso.interpretacion_serico} />
          <Field label="Notas" value={caso.notas_serico} />
          <p className="text-xs" style={{ color: '#9eaaa7' }}>
            Registrado {new Date(caso.serica_registrada_at).toLocaleString('es-CO')}
          </p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Editar</Button>
        </div>
      )}

      {open && (
        <div className="space-y-3">
          <Input label={field1} required value={v1} onChange={(e) => setV1(e.target.value)} />
          {field2 && <Input label={field2} value={v2} onChange={(e) => setV2(e.target.value)} />}
          <Input label="Interpretación" value={interp} onChange={(e) => setInterp(e.target.value)} />
          <Input label="Notas adicionales" value={notas} onChange={(e) => setNotas(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={handleSave}>Guardar resultado</Button>
            {caso.serica_registrada_at && (
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            )}
          </div>
        </div>
      )}

      {!caso.serica_registrada_at && !open && (
        <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin resultado registrado.</p>
      )}
    </SectionCard>
  );
}

// helper
function campo2Show(caso: DxCasoDetalle) {
  return caso.programas?.codigo === 'WILSON';
}

// ─── Section: Indicación genética ────────────────────────────────────────────

function IndicacionSection({ caso, onMutate }: { caso: DxCasoDetalle; onMutate: () => void }) {
  const [tieneInd, setTieneInd] = useState<string>(
    caso.tiene_indicacion_genetica === true ? 'si'
    : caso.tiene_indicacion_genetica === false ? 'no' : '',
  );
  const [motivo, setMotivo] = useState(caso.indicacion_motivo ?? '');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(!caso.indicacion_registrada_at);

  const handleSave = async () => {
    if (!tieneInd) { toast.error('Seleccione si hay o no indicación genética'); return; }
    setSaving(true);
    try {
      await setIndicacion(caso.id, { tiene_indicacion_genetica: tieneInd === 'si', motivo: motivo || undefined });
      toast.success('Indicación genética registrada.');
      setOpen(false); onMutate();
    } catch (err) { toast.error(getDxError(err)); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard title="Indicación genética" collapsible defaultOpen>
      {caso.indicacion_registrada_at && !open ? (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: caso.tiene_indicacion_genetica ? 'rgba(22,163,74,0.1)' : 'rgba(186,26,26,0.08)',
                color: caso.tiene_indicacion_genetica ? '#16a34a' : '#ba1a1a',
              }}
            >
              {caso.tiene_indicacion_genetica ? 'Con indicación genética' : 'Sin indicación genética'}
            </span>
          </div>
          <Field label="Motivo" value={caso.indicacion_motivo} />
          <p className="text-xs" style={{ color: '#9eaaa7' }}>
            Registrado {new Date(caso.indicacion_registrada_at).toLocaleString('es-CO')}
          </p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Editar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Indicación *</label>
            <select className={selectCls} style={selectStyle} value={tieneInd} onChange={(e) => setTieneInd(e.target.value)}>
              <option value="">Seleccione…</option>
              <option value="si">Sí — tiene indicación genética</option>
              <option value="no">No — sin indicación genética</option>
            </select>
          </div>
          <Input label="Motivo / justificación" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={handleSave}>Guardar indicación</Button>
            {caso.indicacion_registrada_at && (
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section: Resultado genético ──────────────────────────────────────────────

function GeneticaSection({ caso, onMutate }: { caso: DxCasoDetalle; onMutate: () => void }) {
  const [estadoGen, setEstadoGen] = useState(caso.estado_genetico ?? '');
  const [resultado, setResultado] = useState(caso.resultado_genetico ?? '');
  const [laboratorio, setLaboratorio] = useState(caso.laboratorio_genetico ?? '');
  const [fecha, setFecha] = useState(caso.fecha_genetica ?? '');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(!caso.genetica_registrada_at);

  const handleSave = async () => {
    if (!estadoGen) { toast.error('Seleccione el estado genético'); return; }
    setSaving(true);
    try {
      await registrarGenetica(caso.id, {
        estado_genetico: estadoGen,
        resultado_genetico: resultado || undefined,
        laboratorio_genetico: laboratorio || undefined,
        fecha_genetica: fecha || undefined,
      });
      toast.success('Resultado genético registrado.');
      setOpen(false); onMutate();
    } catch (err) { toast.error(getDxError(err)); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard title="Resultado genético" collapsible defaultOpen>
      {caso.genetica_registrada_at && !open ? (
        <div className="space-y-2 mb-3">
          <Field label="Estado genético" value={caso.estado_genetico} />
          <Field label="Resultado" value={caso.resultado_genetico} />
          <Field label="Laboratorio" value={caso.laboratorio_genetico} />
          <Field label="Fecha" value={caso.fecha_genetica} />
          <p className="text-xs" style={{ color: '#9eaaa7' }}>
            Registrado {new Date(caso.genetica_registrada_at).toLocaleString('es-CO')}
          </p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Editar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Estado genético *</label>
            <select className={selectCls} style={selectStyle} value={estadoGen} onChange={(e) => setEstadoGen(e.target.value)}>
              <option value="">Seleccione…</option>
              {ESTADOS_GENETICO.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <Input label="Resultado genético" value={resultado} onChange={(e) => setResultado(e.target.value)} hint="Ej: Positivo variante patogénica ATP7B" />
          <Input label="Laboratorio / institución" value={laboratorio} onChange={(e) => setLaboratorio(e.target.value)} />
          <Input label="Fecha del resultado" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={handleSave}>Guardar resultado</Button>
            {caso.genetica_registrada_at && (
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section: Seguimiento ─────────────────────────────────────────────────────

function SeguimientoSection({ caso, onMutate }: { caso: DxCasoDetalle; onMutate: () => void }) {
  const [seg, setSeg] = useState(caso.seguimiento_clinico ?? '');
  const [notas, setNotas] = useState(caso.notas_seguimiento ?? '');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(!caso.seguimiento_registrado_at);

  const handleSave = async () => {
    if (!seg) { toast.error('Seleccione el seguimiento clínico'); return; }
    setSaving(true);
    try {
      await registrarSeguimiento(caso.id, { seguimiento_clinico: seg, notas_seguimiento: notas || undefined });
      toast.success('Seguimiento registrado.');
      setOpen(false); onMutate();
    } catch (err) { toast.error(getDxError(err)); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard title="Seguimiento clínico" collapsible defaultOpen>
      {caso.seguimiento_registrado_at && !open ? (
        <div className="space-y-2 mb-3">
          <Field label="Seguimiento" value={caso.seguimiento_clinico} />
          <Field label="Notas" value={caso.notas_seguimiento} />
          <p className="text-xs" style={{ color: '#9eaaa7' }}>
            Registrado {new Date(caso.seguimiento_registrado_at).toLocaleString('es-CO')}
          </p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Editar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Resultado clínico *</label>
            <select className={selectCls} style={selectStyle} value={seg} onChange={(e) => setSeg(e.target.value)}>
              <option value="">Seleccione…</option>
              {ESTADOS_SEGUIMIENTO.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>Notas de seguimiento</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(27,122,107,0.20)]"
              style={{ background: '#f2f4f4', border: '1px solid #bec9c5', color: '#191c1d' }}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={handleSave}>Guardar seguimiento</Button>
            {caso.seguimiento_registrado_at && (
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section: Audit log ───────────────────────────────────────────────────────

function AuditLog({ entries }: { entries: DxAuditEntry[] }) {
  return (
    <SectionCard title="Actividad reciente" collapsible defaultOpen={false}>
      <div className="space-y-3">
        {entries.length === 0 && (
          <p className="text-xs" style={{ color: '#9eaaa7' }}>Sin actividad registrada.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: '#1B7A6B' }} />
              <div className="flex-1 w-px" style={{ background: '#e0e8e5', marginTop: '4px' }} />
            </div>
            <div className="pb-3">
              <p className="text-xs font-semibold" style={{ color: '#191c1d' }}>{e.accion}</p>
              <p className="text-xs" style={{ color: '#9eaaa7' }}>
                {e.actor_tipo} · {new Date(e.created_at).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CasoDetail({ casoId }: { casoId: string }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['dx-caso', casoId] });

  const { data: caso, isLoading, isError } = useQuery({
    queryKey: ['dx-caso', casoId],
    queryFn: () => getCaso(casoId),
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#e0e8e5' }} />
        ))}
      </div>
    );
  }

  if (isError || !caso) {
    return (
      <p className="text-sm" style={{ color: '#ba1a1a' }}>
        Error al cargar el caso. Verifique que el ID sea correcto.
      </p>
    );
  }

  const programa = caso.programas?.codigo;
  const showIndicacion = programa === 'DUCHENNE' || !!caso.serica_registrada_at;
  const showGenetica   = !!caso.tiene_indicacion_genetica || ['CON_INDICACION_GENETICA','GENETICA_PROGRAMADA','GENETICA_EN_PROCESAMIENTO','GENETICA_RESULTADO_DISPONIBLE','COMPLETADO'].includes(caso.estado);
  const showSeguimiento = ['GENETICA_RESULTADO_DISPONIBLE', 'COMPLETADO', 'SIN_INDICACION_GENETICA'].includes(caso.estado) || !!caso.seguimiento_registrado_at;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dx/casos" className="inline-flex items-center gap-1 text-xs mb-2 hover:underline" style={{ color: '#6e7976' }}>
            <ArrowLeft size={12} /> Casos DX
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black font-mono" style={{ color: '#1B7A6B' }}>
              {caso.consecutivo}
            </h1>
            <Badge estado={caso.estado} />
          </div>
          <p className="text-sm mt-1" style={{ color: '#6e7976' }}>
            {caso.programas?.nombre} · {PAIS_LABELS[caso.pais_codigo] ?? caso.pais_codigo} ·{' '}
            {new Date(caso.created_at).toLocaleDateString('es-CO')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <EstadoSection caso={caso} onMutate={invalidate} />
          <LinkPacienteSection caso={caso} onMutate={invalidate} />

          {/* Datos médico */}
          <SectionCard title="Médico solicitante" collapsible>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Nombre" value={caso.medico_nombre} />
              <Field label="Especialidad" value={caso.medico_especialidad} />
              <Field label="Registro" value={`${caso.medico_tipo_registro ?? ''} ${caso.medico_numero_registro}`.trim()} />
              <Field label="Email" value={caso.medico_email} />
              <Field label="WhatsApp" value={caso.medico_whatsapp} />
              <Field label="Institución" value={caso.medico_institucion} />
              <Field label="Ciudad" value={caso.medico_ciudad} />
            </div>
          </SectionCard>

          {/* Datos paciente */}
          <SectionCard title="Paciente" collapsible>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Nombre" value={caso.paciente_nombre} />
              <Field label="Iniciales" value={caso.paciente_iniciales} />
              <Field label="Documento" value={`${caso.paciente_tipo_doc ?? ''} ${caso.paciente_num_doc ?? ''}`.trim()} />
              <Field label="Género" value={caso.paciente_genero} />
              <Field label="EPS / Aseguradora" value={caso.paciente_eps} />
              <Field label="Teléfono" value={caso.paciente_telefono} />
              <Field label="Email" value={caso.paciente_email} />
              <Field label="Ciudad" value={caso.paciente_ciudad} />
              <Field label="Departamento" value={caso.paciente_departamento} />
              <Field label="Dirección" value={caso.paciente_direccion} />
            </div>
            {caso.rep_nombre && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f2f4f4' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#9eaaa7' }}>Representante legal</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Nombre" value={caso.rep_nombre} />
                  <Field label="Parentesco" value={caso.rep_parentesco} />
                  <Field label="Documento" value={caso.rep_documento} />
                  <Field label="Teléfono" value={caso.rep_telefono} />
                </div>
              </div>
            )}
            {caso.resultado_previo_valor && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f2f4f4' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#9eaaa7' }}>Resultado previo</p>
                <Field label="Valor" value={caso.resultado_previo_valor} />
                <Field label="Interpretación" value={caso.resultado_previo_interpretacion} />
                {caso.resultado_previo_pdf_url && (
                  <a
                    href={caso.resultado_previo_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-2 hover:underline"
                    style={{ color: '#1B7A6B' }}
                  >
                    <ExternalLink size={12} /> Ver PDF
                  </a>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SericaSection caso={caso} onMutate={invalidate} />
          {showIndicacion && <IndicacionSection caso={caso} onMutate={invalidate} />}
          {showGenetica   && <GeneticaSection caso={caso} onMutate={invalidate} />}
          {showSeguimiento && <SeguimientoSection caso={caso} onMutate={invalidate} />}
          <AuditLog entries={caso.audit_log ?? []} />
        </div>
      </div>
    </div>
  );
}
