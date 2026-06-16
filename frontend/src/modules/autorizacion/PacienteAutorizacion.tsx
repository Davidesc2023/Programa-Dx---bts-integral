'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, User, Stethoscope, Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { responderAutorizacion } from '@/services/autorizacion.service';
import type { AutorizacionData, AutorizacionRespuesta } from '@/types/dx.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function programaLabel(consecutivo: string): string {
  if (consecutivo.startsWith('WILSON'))   return 'Enfermedad de Wilson';
  if (consecutivo.startsWith('DAAT'))     return 'Déficit de Alfa-1 Antitripsina';
  if (consecutivo.startsWith('DUCHENNE')) return 'Distrofia Muscular de Duchenne';
  return consecutivo.split('-')[0];
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  decision: z.enum(['AUTORIZADO', 'NO_AUTORIZADO'], {
    errorMap: () => ({ message: 'Seleccione una opción para continuar' }),
  }),
  nombre_firmado: z
    .string()
    .min(3, 'Escriba su nombre completo (mínimo 3 caracteres)'),
  correccion_datos: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data: AutorizacionData;
  token: string;
}

export function PacienteAutorizacion({ data, token }: Props) {
  const { caso, consentimiento, expira_at } = data;
  const [confirmacion, setConfirmacion] = useState<AutorizacionRespuesta | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const decision = watch('decision');

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await responderAutorizacion(token, {
        respuesta:        values.decision,
        nombre_firmado:   values.nombre_firmado.trim(),
        correccion_datos: values.correccion_datos?.trim() || undefined,
      });
      setConfirmacion(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Error al enviar su respuesta. Por favor intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmación post-submit ──────────────────────────────────────────────
  if (confirmacion) {
    const autorizo = confirmacion.respuesta === 'AUTORIZADO';
    return (
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-8 text-center shadow-sm">
        {autorizo ? (
          <CheckCircle size={56} style={{ color: '#1B7A6B' }} strokeWidth={1.5} className="mx-auto mb-4" />
        ) : (
          <XCircle size={56} style={{ color: '#6e7976' }} strokeWidth={1.5} className="mx-auto mb-4" />
        )}
        <h1 className="text-xl font-bold mb-2" style={{ color: '#191c1d' }}>
          {autorizo ? '¡Autorización confirmada!' : 'Respuesta registrada'}
        </h1>
        <p className="text-sm mb-4" style={{ color: '#6e7976' }}>
          {autorizo
            ? 'Su autorización ha sido registrada. El equipo de BTS Integral coordinará los siguientes pasos del programa y se pondrá en contacto con usted.'
            : 'Su decisión ha sido registrada. Si tiene preguntas, comuníquese con el médico que realizó la solicitud.'}
        </p>
        <div
          className="inline-block rounded-xl px-5 py-2 text-sm font-mono font-bold mb-4"
          style={{ background: 'rgba(27,122,107,0.08)', color: '#1B7A6B' }}
        >
          {confirmacion.consecutivo}
        </div>
        <p className="text-xs" style={{ color: '#9eaaa7' }}>
          Registrado el {formatFecha(confirmacion.firmado_at)}
        </p>
      </div>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#1B7A6B' }}>
          BTS Integral · Programa de Diagnóstico Genético
        </p>
        <h1 className="text-xl font-bold mb-4" style={{ color: '#191c1d' }}>
          Autorización para participar en el programa
        </h1>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User size={16} className="mt-0.5 shrink-0" style={{ color: '#1B7A6B' }} />
            <div>
              <p className="text-xs font-medium" style={{ color: '#9eaaa7' }}>Paciente</p>
              <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>
                {caso.paciente_nombre}
              </p>
              {caso.rep_nombre && (
                <p className="text-xs mt-0.5" style={{ color: '#6e7976' }}>
                  Representante: {caso.rep_nombre} ({caso.rep_parentesco})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Stethoscope size={16} className="mt-0.5 shrink-0" style={{ color: '#1B7A6B' }} />
            <div>
              <p className="text-xs font-medium" style={{ color: '#9eaaa7' }}>Programa · Médico</p>
              <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>
                {programaLabel(caso.consecutivo)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6e7976' }}>
                Solicitado por {caso.medico_nombre}
                {caso.medico_institucion ? ` · ${caso.medico_institucion}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={16} className="mt-0.5 shrink-0" style={{ color: '#d97706' }} />
            <div>
              <p className="text-xs font-medium" style={{ color: '#9eaaa7' }}>Este enlace vence el</p>
              <p className="text-sm" style={{ color: '#d97706' }}>
                {formatFecha(expira_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Consentimiento */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-1" style={{ color: '#191c1d' }}>
          {consentimiento?.titulo ?? 'Consentimiento informado'}
        </h2>
        {consentimiento?.version && (
          <p className="text-xs mb-3" style={{ color: '#9eaaa7' }}>
            versión {consentimiento.version}
          </p>
        )}

        {consentimiento ? (
          <div
            className="rounded-xl p-4 text-sm overflow-y-auto"
            style={{
              background: '#f2f4f4',
              border: '1px solid #e0e8e5',
              maxHeight: '340px',
              color: '#3e4946',
              lineHeight: 1.75,
            }}
            dangerouslySetInnerHTML={{ __html: consentimiento.cuerpo_html }}
          />
        ) : (
          <div
            className="rounded-xl px-4 py-6 text-center text-sm"
            style={{ background: '#f2f4f4', color: '#9eaaa7' }}
          >
            El documento de consentimiento no está disponible para su país en este momento.
            Comuníquese con el médico solicitante.
          </div>
        )}
      </div>

      {/* Decisión */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#191c1d' }}>
          Su decisión
        </h2>

        <Controller
          name="decision"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              {/* Autorizo */}
              <label
                className={`flex items-start gap-3 rounded-xl p-4 cursor-pointer border transition-colors ${
                  field.value === 'AUTORIZADO'
                    ? 'border-[#1B7A6B]'
                    : 'border-[#e0e8e5] hover:border-[#bec9c5]'
                }`}
                style={{
                  background: field.value === 'AUTORIZADO'
                    ? 'rgba(27,122,107,0.05)'
                    : '#fafbfb',
                }}
              >
                <input
                  type="radio"
                  value="AUTORIZADO"
                  checked={field.value === 'AUTORIZADO'}
                  onChange={() => field.onChange('AUTORIZADO')}
                  className="mt-0.5 accent-[#1B7A6B] shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>
                    Autorizo mi participación en el programa
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6e7976' }}>
                    Confirmo que leí el consentimiento y acepto participar en el programa de tamizaje genético.
                  </p>
                </div>
              </label>

              {/* No autorizo */}
              <label
                className={`flex items-start gap-3 rounded-xl p-4 cursor-pointer border transition-colors ${
                  field.value === 'NO_AUTORIZADO'
                    ? 'border-[#ba1a1a]'
                    : 'border-[#e0e8e5] hover:border-[#bec9c5]'
                }`}
                style={{
                  background: field.value === 'NO_AUTORIZADO'
                    ? 'rgba(186,26,26,0.04)'
                    : '#fafbfb',
                }}
              >
                <input
                  type="radio"
                  value="NO_AUTORIZADO"
                  checked={field.value === 'NO_AUTORIZADO'}
                  onChange={() => field.onChange('NO_AUTORIZADO')}
                  className="mt-0.5 shrink-0"
                  style={{ accentColor: '#ba1a1a' }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>
                    No autorizo mi participación
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6e7976' }}>
                    Puedo cambiar mi decisión en el futuro comunicándome con mi médico.
                  </p>
                </div>
              </label>
            </div>
          )}
        />
        {errors.decision && (
          <p className="text-xs mt-2" style={{ color: '#ba1a1a' }}>
            {errors.decision.message}
          </p>
        )}
      </div>

      {/* Firma y correcciones */}
      <div className="bg-white rounded-2xl border border-[#e0e8e5] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold" style={{ color: '#191c1d' }}>
          Firma digital
        </h2>

        <Input
          label="Escriba su nombre completo como firma"
          required
          hint={
            caso.rep_nombre
              ? `Nombre del representante o del paciente`
              : 'Nombre del paciente tal como aparece en su documento de identidad'
          }
          error={errors.nombre_firmado?.message}
          {...register('nombre_firmado')}
        />

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#3e4946' }}>
            ¿Algún dato es incorrecto? (opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Indique aquí cualquier corrección que deba hacerse a sus datos…"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(27,122,107,0.20)]"
            style={{ background: '#f2f4f4', border: '1px solid #bec9c5', color: '#191c1d' }}
            {...register('correccion_datos')}
          />
          <p className="text-xs mt-1" style={{ color: '#9eaaa7' }}>
            El equipo revisará su comentario y se comunicará para confirmar los cambios.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pb-4">
        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={submitting || !decision}
          variant={decision === 'NO_AUTORIZADO' ? 'secondary' : 'primary'}
          className="w-full md:w-auto min-w-[220px]"
        >
          {submitting
            ? 'Enviando…'
            : decision === 'NO_AUTORIZADO'
              ? 'Confirmar no autorización'
              : 'Confirmar autorización'}
        </Button>
      </div>
    </form>
  );
}
