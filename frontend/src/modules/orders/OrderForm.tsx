'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle, CheckCircle2, Clock, FlaskConical,
  Lock, Plus, Search, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { orderSchema, type OrderFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/Button';
import { PatientPicker } from '@/components/ui/PatientPicker';
import { DoctorPicker } from '@/components/ui/DoctorPicker';
import { Priority } from '@/types/enums';
import type { Order } from '@/types/api.types';
import { getLabTests, checkPrerequisite, type LabTest } from '@/services/lab-tests.service';

const LAB_TYPE_LABELS: Record<LabTest['type'], string> = {
  NIVEL_SERICO: 'Sérico',
  GENETICO: 'Genético',
  PANEL: 'Panel',
  IMAGEN: 'Imagen',
  MICROBIOLOGIA: 'Microbiología',
  OTRO: 'Otro',
};

const LAB_TYPE_COLORS: Record<LabTest['type'], { bg: string; text: string }> = {
  NIVEL_SERICO: { bg: 'rgba(0,97,163,0.10)', text: '#004474' },
  GENETICO:     { bg: 'rgba(116,91,0,0.12)', text: '#5c4400' },
  PANEL:        { bg: 'rgba(27,122,107,0.10)', text: '#006053' },
  IMAGEN:       { bg: 'rgba(110,121,118,0.10)', text: '#3e4946' },
  MICROBIOLOGIA:{ bg: 'rgba(186,26,26,0.08)', text: '#ba1a1a' },
  OTRO:         { bg: 'rgba(110,121,118,0.10)', text: '#3e4946' },
};

interface SelectedExam {
  labTestId: string;
  examCode: string;
  examName: string;
  notes?: string;
}

interface OrderFormProps {
  defaultValues?: Partial<Order>;
  preselectedPatientId?: string;
  onSubmit: (values: OrderFormValues & { selectedExams: SelectedExam[] }) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function OrderForm({
  defaultValues,
  preselectedPatientId,
  onSubmit,
  isLoading = false,
  onCancel,
}: OrderFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({});
  const [loadingPrereq, setLoadingPrereq] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      patientId: defaultValues?.patientId ?? preselectedPatientId ?? '',
      doctorId: defaultValues?.doctorId ?? '',
      diagnosis: defaultValues?.diagnosis ?? '',
      priority: (defaultValues?.priority as OrderFormValues['priority']) ?? 'NORMAL',
      estimatedCompletionDate: defaultValues?.estimatedCompletionDate?.slice(0, 10) ?? '',
      observations: defaultValues?.observations ?? '',
    },
  });

  const patientId = watch('patientId');

  useEffect(() => {
    if (preselectedPatientId) setValue('patientId', preselectedPatientId);
  }, [preselectedPatientId, setValue]);

  // Cargar catálogo
  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: getLabTests,
    staleTime: 5 * 60 * 1000,
  });

  // Agrupar por categoría
  const byCategory = catalog.reduce<Record<string, LabTest[]>>((acc, t) => {
    const cat = t.category ?? 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const categories = Object.keys(byCategory).sort();

  // Al cargar el catálogo, expandir todas las categorías
  useEffect(() => {
    if (categories.length > 0) {
      setExpandedCategories(new Set(categories));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.length]);

  // Verificar prerrequisitos cuando el paciente cambia o se selecciona un test
  const verifyPrerequisite = useCallback(
    async (test: LabTest) => {
      if (!test.requiresResultFromId || !patientId) {
        setUnlockedMap((p) => ({ ...p, [test.id]: !test.requiresResultFromId }));
        return;
      }
      setLoadingPrereq((p) => new Set(p).add(test.id));
      try {
        const result = await checkPrerequisite(test.id, patientId);
        setUnlockedMap((p) => ({ ...p, [test.id]: result.unlocked }));
      } catch {
        setUnlockedMap((p) => ({ ...p, [test.id]: false }));
      } finally {
        setLoadingPrereq((p) => { const s = new Set(p); s.delete(test.id); return s; });
      }
    },
    [patientId],
  );

  // Re-verificar todos los que tienen prerrequisito cuando cambia el paciente
  useEffect(() => {
    catalog
      .filter((t) => t.requiresResultFromId)
      .forEach((t) => verifyPrerequisite(t));
  }, [patientId, catalog, verifyPrerequisite]);

  const isLocked = (test: LabTest): boolean =>
    Boolean(test.requiresResultFromId) && unlockedMap[test.id] !== true;

  const toggleExam = (test: LabTest) => {
    if (isLocked(test)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(test.id)) next.delete(test.id);
      else next.add(test.id);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const selectedTests = catalog.filter((t) => selectedIds.has(t.id));
  const maxHours = selectedTests.reduce((m, t) => Math.max(m, t.estimatedHours ?? 0), 0);

  const filteredCatalog = search.trim()
    ? catalog.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.toLowerCase().includes(search.toLowerCase()) ||
          (t.category ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  const onFormSubmit = (values: OrderFormValues) => {
    const selectedExams: SelectedExam[] = selectedTests.map((t) => ({
      labTestId: t.id,
      examCode: t.code,
      examName: t.name,
    }));
    onSubmit({ ...values, selectedExams });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col lg:flex-row gap-6 h-full">

      {/* ── LEFT: Patient info + Notes ── */}
      <div className="flex-1 space-y-5">

        {/* Patient */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: '#ffffff', boxShadow: '0px 4px 16px rgba(25,28,29,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(27,122,107,0.10)' }}>
              <FlaskConical size={16} style={{ color: '#1B7A6B' }} />
            </div>
            <h3 className="font-bold text-on-surface text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Información del Paciente
            </h3>
          </div>

          <Controller
            name="patientId"
            control={control}
            render={({ field }) => (
              <PatientPicker
                label="Paciente *"
                value={field.value}
                onChange={field.onChange}
                error={errors.patientId?.message}
                disabled={!!defaultValues?.id}
              />
            )}
          />

          <Controller
            name="doctorId"
            control={control}
            render={({ field }) => (
              <DoctorPicker
                label="Médico solicitante"
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.doctorId?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Prioridad
              </label>
              <div className="flex gap-2">
                {[
                  { value: Priority.NORMAL, label: 'Normal', color: '#006053' },
                  { value: Priority.URGENTE, label: 'Urgente', color: '#ba1a1a' },
                ].map((opt) => {
                  const current = watch('priority');
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('priority', opt.value as OrderFormValues['priority'])}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: active ? opt.color : '#f2f4f4',
                        color: active ? '#ffffff' : '#3e4946',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Fecha estimada
              </label>
              <input
                type="date"
                {...register('estimatedCompletionDate')}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#ffffff', boxShadow: '0px 4px 16px rgba(25,28,29,0.06)' }}
        >
          <h3 className="font-bold text-on-surface text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Notas Clínicas y Observaciones
          </h3>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">
              Diagnóstico / Justificación clínica
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Sospecha de enfisema pulmonar, déficit de Alfa-1 Antitripsina…"
              {...register('diagnosis')}
              className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">
              Observaciones adicionales
            </label>
            <textarea
              rows={3}
              placeholder="Síntomas, condiciones especiales, instrucciones para el laboratorio…"
              {...register('observations')}
              className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Exam catalog + Summary ── */}
      <div className="lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4">

        {/* Catalog */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{ background: '#ffffff', boxShadow: '0px 4px 16px rgba(25,28,29,0.06)' }}
        >
          <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: '#f2f4f4' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-on-surface text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Exámenes
              </h3>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(27,122,107,0.10)', color: '#006053' }}
              >
                Multi-select
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline/50" />
              <input
                type="text"
                placeholder="Buscar examen o categoría…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {catalogLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-outline text-sm">
                <Loader2 size={16} className="animate-spin" />
                Cargando catálogo…
              </div>
            ) : filteredCatalog ? (
              /* Resultados de búsqueda */
              <div className="p-3 space-y-1.5">
                {filteredCatalog.length === 0 ? (
                  <p className="text-center text-sm text-outline py-6">Sin resultados para "{search}"</p>
                ) : (
                  filteredCatalog.map((test) => (
                    <ExamRow
                      key={test.id}
                      test={test}
                      selected={selectedIds.has(test.id)}
                      locked={isLocked(test)}
                      loadingPrereq={loadingPrereq.has(test.id)}
                      onToggle={() => toggleExam(test)}
                    />
                  ))
                )}
              </div>
            ) : (
              /* Vista por categorías */
              <div className="p-3 space-y-1">
                {categories.map((cat) => (
                  <div key={cat}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-container-low transition-colors"
                    >
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#3e4946' }}>
                        {cat}
                      </span>
                      {expandedCategories.has(cat)
                        ? <ChevronUp size={13} className="text-outline" />
                        : <ChevronDown size={13} className="text-outline" />
                      }
                    </button>
                    {expandedCategories.has(cat) && (
                      <div className="space-y-1 mt-1 mb-2">
                        {byCategory[cat].map((test) => (
                          <ExamRow
                            key={test.id}
                            test={test}
                            selected={selectedIds.has(test.id)}
                            locked={isLocked(test)}
                            loadingPrereq={loadingPrereq.has(test.id)}
                            onToggle={() => toggleExam(test)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: '#006053', color: '#ffffff' }}
        >
          <h3 className="font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Resumen
          </h3>

          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <p className="text-2xl font-black" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {selectedIds.size.toString().padStart(2, '0')}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70 mt-0.5">
                Exámenes
              </p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <p className="text-lg font-black" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {maxHours > 0 ? `${maxHours}h` : '—'}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70 mt-0.5">
                Entrega est.
              </p>
            </div>
          </div>

          {/* Exámenes seleccionados */}
          {selectedTests.length > 0 && (
            <div className="space-y-1.5">
              {selectedTests.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="shrink-0 text-white/70" />
                  <span className="text-xs font-medium text-white/90 truncate">{t.name}</span>
                </div>
              ))}
            </div>
          )}

          {selectedIds.size === 0 && (
            <p className="text-xs text-white/60 text-center flex items-center justify-center gap-1.5">
              <Plus size={12} />
              Selecciona exámenes del catálogo
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={isLoading || selectedIds.size === 0}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedIds.size > 0 ? '#ffffff' : 'rgba(255,255,255,0.2)',
                color: selectedIds.size > 0 ? '#006053' : 'rgba(255,255,255,0.5)',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {isLoading
                ? <><Loader2 size={15} className="animate-spin" /> Generando…</>
                : '✓ Generar Orden y Consentimiento'
              }
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Componente de fila de examen ──────────────────────────────────────────────

interface ExamRowProps {
  test: LabTest;
  selected: boolean;
  locked: boolean;
  loadingPrereq: boolean;
  onToggle: () => void;
}

function ExamRow({ test, selected, locked, loadingPrereq, onToggle }: ExamRowProps) {
  const typeColor = LAB_TYPE_COLORS[test.type];

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className="w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3"
      style={{
        background: selected
          ? 'rgba(27,122,107,0.08)'
          : locked
          ? 'rgba(110,121,118,0.04)'
          : 'transparent',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.6 : 1,
      }}
    >
      {/* Checkbox visual */}
      <div
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
        style={{
          borderColor: selected ? '#1B7A6B' : locked ? '#bec9c5' : '#bec9c5',
          background: selected ? '#1B7A6B' : 'transparent',
        }}
      >
        {selected && <CheckCircle2 size={12} color="#ffffff" />}
        {locked && !selected && (
          loadingPrereq
            ? <Loader2 size={10} className="animate-spin text-outline" />
            : <Lock size={10} className="text-outline" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-on-surface leading-tight">{test.name}</p>
          <span
            className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: typeColor.bg, color: typeColor.text }}
          >
            {LAB_TYPE_LABELS[test.type]}
          </span>
        </div>

        {test.description && (
          <p className="text-xs text-outline mt-0.5 leading-tight">{test.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          {test.estimatedHours && (
            <span className="flex items-center gap-1 text-[10px] text-outline font-medium">
              <Clock size={10} />
              {test.estimatedHours}h
            </span>
          )}
          {test.instructions && (
            <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#745b00' }}>
              <AlertCircle size={10} />
              {test.instructions}
            </span>
          )}
        </div>

        {locked && test.requiresResultFrom && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: '#ba1a1a' }}>
            Requiere resultado de: {test.requiresResultFrom.name}
          </p>
        )}
      </div>
    </button>
  );
}
