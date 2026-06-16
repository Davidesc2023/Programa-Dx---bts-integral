'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { publicCrearCaso, publicSubirResultadoPrevio } from '@/services/public.service';
import type { PublicFormData } from '@/types/dx.types';

// ─── Config ──────────────────────────────────────────────────────────────────

const PAIS_NOMBRES: Record<string, string> = {
  CO: 'Colombia',
  EC: 'Ecuador',
  PA: 'Panamá',
  CL: 'Chile',
  CR: 'Costa Rica',
  SV: 'El Salvador',
  DO: 'República Dominicana',
  GT: 'Guatemala',
};

const TIPOS_DOC = [
  { value: 'CC',  label: 'Cédula de Ciudadanía' },
  { value: 'TI',  label: 'Tarjeta de Identidad' },
  { value: 'CE',  label: 'Cédula de Extranjería' },
  { value: 'PA',  label: 'Pasaporte' },
  { value: 'RC',  label: 'Registro Civil' },
  { value: 'AS',  label: 'Adulto sin identificación' },
  { value: 'MS',  label: 'Menor sin identificación' },
  { value: 'NUI', label: 'Número único de identificación' },
];

const PROGRAMA_CONFIG = {
  wilson: {
    nombre: 'Enfermedad de Wilson',
    campo1Label: 'Ceruloplasmina sérica',
    campo1Hint:  'Valor en mg/dL',
    campo2Label: 'Cobre en orina de 24 horas',
    campo2Hint:  'Valor en µg/24h',
    tienePdf: false,
  },
  alfa1: {
    nombre: 'Déficit de Alfa-1 Antitripsina',
    campo1Label: 'Alfa-1 antitripsina sérica',
    campo1Hint:  'Valor en mg/dL',
    campo2Label: null,
    campo2Hint:  null,
    tienePdf: false,
  },
  duchenne: {
    nombre: 'Distrofia Muscular de Duchenne',
    campo1Label: 'Creatina quinasa sérica (CK)',
    campo1Hint:  'Valor en U/L',
    campo2Label: null,
    campo2Hint:  null,
    tienePdf: true,
  },
} as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    pais_codigo: z.string().min(2, 'Seleccione un país'),

    medico_nombre:          z.string().min(2, 'Campo requerido'),
    medico_especialidad:    z.string().min(2, 'Campo requerido'),
    medico_tipo_registro:   z.string().optional(),
    medico_numero_registro: z.string().min(1, 'Campo requerido'),
    medico_email:           z.string().email('Email inválido'),
    medico_whatsapp:        z.string().optional(),
    medico_institucion:     z.string().optional(),
    medico_ciudad:          z.string().optional(),

    paciente_nombre:       z.string().min(2, 'Campo requerido'),
    paciente_tipo_doc:     z.string().min(1, 'Seleccione un tipo'),
    paciente_num_doc:      z.string().min(3, 'Campo requerido'),
    paciente_genero:       z.string().optional(),
    paciente_eps:          z.string().optional(),
    paciente_telefono:     z.string().optional(),
    paciente_email:        z.union([z.string().email('Email inválido'), z.literal(''), z.undefined()]),
    paciente_ciudad:       z.string().optional(),
    paciente_departamento: z.string().optional(),
    paciente_pais:         z.string().optional(),
    paciente_direccion:    z.string().optional(),

    tiene_representante: z.boolean(),
    rep_nombre:          z.string().optional(),
    rep_documento:       z.string().optional(),
    rep_parentesco:      z.string().optional(),
    rep_telefono:        z.string().optional(),

    resultado_previo_valor_1:        z.string().optional(),
    resultado_previo_valor_2:        z.string().optional(),
    resultado_previo_interpretacion: z.string().optional(),
    resultado_previo_notas:          z.string().optional(),

    acepta_consentimiento: z.boolean().refine((v) => v === true, {
      message: 'Debe aceptar el consentimiento informado para continuar',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.tiene_representante) {
      if (!data.rep_nombre?.trim())
        ctx.addIssue({ code: 'custom', path: ['rep_nombre'],    message: 'Campo requerido' });
      if (!data.rep_documento?.trim())
        ctx.addIssue({ code: 'custom', path: ['rep_documento'], message: 'Campo requerido' });
      if (!data.rep_parentesco?.trim())
        ctx.addIssue({ code: 'custom', path: ['rep_parentesco'],message: 'Campo requerido' });
    }
  });

type FormValues = z.infer<typeof schema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' ? undefined : v]),
  ) as T;
}

const selectCls =
  'w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[rgba(27,122,107,0.20)] focus:border-[#1B7A6B]';
const selectStyle = { background: '#f2f4f4', border: '1px solid #bec9c5', color: '#191c1d' };

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white shrink-0"
        style={{ background: '#1B7A6B' }}
      >
        {num}
      </span>
      <h2 className="text-base font-semibold" style={{ color: '#191c1d' }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  formData: PublicFormData;
  tenantSlug: string;
  programaSlug: string;
}

export function FormularioMedico({ formData, tenantSlug, programaSlug }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progConf =
    PROGRAMA_CONFIG[programaSlug as keyof typeof PROGRAMA_CONFIG] ?? PROGRAMA_CONFIG.wilson;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tiene_representante: false, acepta_consentimiento: false },
  });

  const paisCodigo          = watch('pais_codigo');
  const tieneRepresentante  = watch('tiene_representante');
  const aceptaConsentimiento = watch('acepta_consentimiento');
  const consentimientoActivo =
    formData.consentimientos.find((c) => c.pais_codigo === paisCodigo) ?? null;

  const onSubmit = async (raw: FormValues) => {
    setSubmitting(true);
    try {
      const payload = stripEmpty(raw) as FormValues;
      const resp = await publicCrearCaso(tenantSlug, programaSlug, payload);
      const caso = resp.data;

      if (programaSlug === 'duchenne' && archivo) {
        try {
          await publicSubirResultadoPrevio(tenantSlug, programaSlug, caso.id, archivo);
        } catch {
          toast.warning('Caso registrado, pero el archivo no pudo cargarse. Contáctenos si es necesario.');
        }
      }

      router.push(
        `/solicitud/${tenantSlug}/${programaSlug}/exito` +
          `?consecutivo=${encodeURIComponent(caso.consecutivo)}` +
          `&paciente=${encodeURIComponent(raw.paciente_nombre)}`,
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar la solicitud. Por favor intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.type !== 'application/pdf') {
      toast.error('Solo se aceptan archivos PDF.');
      return;
    }
    if (f && f.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10 MB.');
      return;
    }
    setArchivo(f);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 mb-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#1B7A6B' }}>
          {formData.tenant.nombre}
        </p>
        <h1 className="text-xl font-bold" style={{ color: '#191c1d' }}>
          Solicitud de tamizaje — {progConf.nombre}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6e7976' }}>
          Complete todos los campos marcados con{' '}
          <span style={{ color: '#ba1a1a' }}>*</span> para enviar la solicitud.
        </p>
      </div>

      {/* ── Sección 1: País ── */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 mb-4 shadow-sm">
        <SectionHeading num={1} title="País de atención" />
        <div className="max-w-xs">
          <label className="block text-sm font-medium mb-1" style={{ color: '#3e4946' }}>
            País <span style={{ color: '#ba1a1a' }}>*</span>
          </label>
          <Controller
            name="pais_codigo"
            control={control}
            render={({ field }) => (
              <select {...field} className={selectCls} style={selectStyle}>
                <option value="">Seleccione un país…</option>
                {formData.consentimientos.map((c) => (
                  <option key={c.pais_codigo} value={c.pais_codigo}>
                    {PAIS_NOMBRES[c.pais_codigo] ?? c.pais_codigo}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.pais_codigo && (
            <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>
              {errors.pais_codigo.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Sección 2: Médico ── */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 mb-4 shadow-sm">
        <SectionHeading num={2} title="Datos del médico solicitante" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre completo"
            required
            error={errors.medico_nombre?.message}
            {...register('medico_nombre')}
          />
          <Input
            label="Especialidad"
            required
            error={errors.medico_especialidad?.message}
            {...register('medico_especialidad')}
          />
          <Input
            label="Número de registro"
            required
            hint="Número de matrícula profesional"
            error={errors.medico_numero_registro?.message}
            {...register('medico_numero_registro')}
          />
          <Input
            label="Tipo de registro"
            hint="Ej: RM, TP, MP"
            error={errors.medico_tipo_registro?.message}
            {...register('medico_tipo_registro')}
          />
          <Input
            label="Email"
            type="email"
            required
            error={errors.medico_email?.message}
            {...register('medico_email')}
          />
          <Input
            label="WhatsApp / Teléfono"
            type="tel"
            hint="Con código de país, ej: +57 300 000 0000"
            error={errors.medico_whatsapp?.message}
            {...register('medico_whatsapp')}
          />
          <Input
            label="Institución / Hospital"
            error={errors.medico_institucion?.message}
            {...register('medico_institucion')}
          />
          <Input
            label="Ciudad"
            error={errors.medico_ciudad?.message}
            {...register('medico_ciudad')}
          />
        </div>
      </div>

      {/* ── Sección 3: Paciente ── */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 mb-4 shadow-sm">
        <SectionHeading num={3} title="Datos del paciente" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nombre completo"
              required
              error={errors.paciente_nombre?.message}
              {...register('paciente_nombre')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3e4946' }}>
              Tipo de documento <span style={{ color: '#ba1a1a' }}>*</span>
            </label>
            <Controller
              name="paciente_tipo_doc"
              control={control}
              render={({ field }) => (
                <select {...field} className={selectCls} style={selectStyle}>
                  <option value="">Seleccione…</option>
                  {TIPOS_DOC.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.paciente_tipo_doc && (
              <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>
                {errors.paciente_tipo_doc.message}
              </p>
            )}
          </div>

          <Input
            label="Número de documento"
            required
            error={errors.paciente_num_doc?.message}
            {...register('paciente_num_doc')}
          />

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3e4946' }}>
              Género
            </label>
            <Controller
              name="paciente_genero"
              control={control}
              render={({ field }) => (
                <select {...field} className={selectCls} style={selectStyle}>
                  <option value="">Sin especificar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              )}
            />
          </div>

          <Input
            label="EPS / Aseguradora"
            error={errors.paciente_eps?.message}
            {...register('paciente_eps')}
          />
          <Input
            label="Teléfono"
            type="tel"
            error={errors.paciente_telefono?.message}
            {...register('paciente_telefono')}
          />
          <Input
            label="Email"
            type="email"
            error={errors.paciente_email?.message}
            {...register('paciente_email')}
          />
          <Input
            label="Departamento / Estado"
            error={errors.paciente_departamento?.message}
            {...register('paciente_departamento')}
          />
          <Input
            label="Ciudad"
            error={errors.paciente_ciudad?.message}
            {...register('paciente_ciudad')}
          />
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              error={errors.paciente_direccion?.message}
              {...register('paciente_direccion')}
            />
          </div>

          {/* Representante legal */}
          <div className="md:col-span-2 flex items-center gap-2">
            <Controller
              name="tiene_representante"
              control={control}
              render={({ field }) => (
                <input
                  id="tiene_representante"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1B7A6B]"
                />
              )}
            />
            <label htmlFor="tiene_representante" className="text-sm cursor-pointer" style={{ color: '#3e4946' }}>
              El paciente tiene representante legal o acudiente
            </label>
          </div>

          {tieneRepresentante && (
            <>
              <Input
                label="Nombre del representante"
                required
                error={errors.rep_nombre?.message}
                {...register('rep_nombre')}
              />
              <Input
                label="Documento del representante"
                required
                error={errors.rep_documento?.message}
                {...register('rep_documento')}
              />
              <Input
                label="Parentesco"
                required
                hint="Ej: Madre, Padre, Tutor"
                error={errors.rep_parentesco?.message}
                {...register('rep_parentesco')}
              />
              <Input
                label="Teléfono del representante"
                type="tel"
                error={errors.rep_telefono?.message}
                {...register('rep_telefono')}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Sección 4: Resultado previo ── */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 mb-4 shadow-sm">
        <SectionHeading num={4} title="Resultado previo (opcional)" />
        <p className="text-sm mb-4" style={{ color: '#6e7976' }}>
          Si cuenta con resultados de laboratorio previos, ingrese los valores. Esto es opcional
          pero ayuda a agilizar el proceso.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={progConf.campo1Label}
            hint={progConf.campo1Hint ?? undefined}
            error={errors.resultado_previo_valor_1?.message}
            {...register('resultado_previo_valor_1')}
          />
          {progConf.campo2Label && (
            <Input
              label={progConf.campo2Label}
              hint={progConf.campo2Hint ?? undefined}
              error={errors.resultado_previo_valor_2?.message}
              {...register('resultado_previo_valor_2')}
            />
          )}
          <div className="md:col-span-2">
            <Input
              label="Interpretación / Observaciones"
              error={errors.resultado_previo_interpretacion?.message}
              {...register('resultado_previo_interpretacion')}
            />
          </div>

          {progConf.tienePdf && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: '#3e4946' }}>
                Resultado de laboratorio (PDF, máx. 10 MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleArchivoChange}
              />
              {archivo ? (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(27,122,107,0.06)', border: '1px solid rgba(27,122,107,0.2)' }}
                >
                  <span style={{ color: '#1B7A6B' }}>{archivo.name}</span>
                  <button
                    type="button"
                    onClick={() => { setArchivo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="ml-3 rounded-full p-1 hover:bg-[rgba(186,26,26,0.08)]"
                    style={{ color: '#ba1a1a' }}
                    aria-label="Quitar archivo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors hover:border-[#1B7A6B]"
                  style={{ border: '2px dashed #bec9c5', color: '#6e7976', width: '100%' }}
                >
                  <Upload size={16} />
                  Adjuntar PDF del resultado
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sección 5: Consentimiento ── */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 mb-6 shadow-sm">
        <SectionHeading num={5} title="Consentimiento informado" />

        {!consentimientoActivo ? (
          <div
            className="rounded-xl px-4 py-6 text-center text-sm"
            style={{ background: '#f2f4f4', color: '#9eaaa7' }}
          >
            Seleccione el país de atención (sección 1) para ver el consentimiento informado
            correspondiente.
          </div>
        ) : (
          <>
            <p className="text-xs font-medium mb-2" style={{ color: '#6e7976' }}>
              {consentimientoActivo.titulo} · versión {consentimientoActivo.version}
            </p>
            <div
              className="rounded-xl p-4 text-sm overflow-y-auto mb-4"
              style={{
                background: '#f2f4f4',
                border: '1px solid #e0e8e5',
                maxHeight: '320px',
                color: '#3e4946',
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{ __html: consentimientoActivo.contenido_html }}
            />

            <div className="flex items-start gap-3">
              <Controller
                name="acepta_consentimiento"
                control={control}
                render={({ field }) => (
                  <input
                    id="acepta_consentimiento"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#1B7A6B] shrink-0"
                  />
                )}
              />
              <label
                htmlFor="acepta_consentimiento"
                className="text-sm cursor-pointer leading-relaxed"
                style={{ color: '#3e4946' }}
              >
                He leído el consentimiento informado en su totalidad y confirmo que el paciente
                (o su representante legal) ha sido informado y acepta participar en el programa.
              </label>
            </div>
            {errors.acepta_consentimiento && (
              <p className="text-xs mt-2" style={{ color: '#ba1a1a' }}>
                {errors.acepta_consentimiento.message}
              </p>
            )}
          </>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={submitting || !aceptaConsentimiento}
          className="w-full md:w-auto min-w-[200px]"
        >
          {submitting ? 'Enviando solicitud…' : 'Enviar solicitud'}
        </Button>
      </div>
    </form>
  );
}
