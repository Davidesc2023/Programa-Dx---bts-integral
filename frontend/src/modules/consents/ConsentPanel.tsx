'use client';

import { useState } from 'react';
import {
  FileText, PenLine, Send, CheckCircle2, XCircle, Plus, Download,
  ChevronDown, ChevronUp, User, UserCheck, Clock, AlertCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useConsent, useCreateConsent, useSignConsent, useSendConsent, useRespondConsent,
} from './useConsent';
import { useAuthStore } from '@/modules/auth/authStore';
import { ConsentStatus, UserRole } from '@/types/enums';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

/* ── Derivados del estado global del consentimiento ── */
type StepState = 'done' | 'active' | 'waiting' | 'accepted' | 'rejected';

function getDoctorStep(status: ConsentStatus): StepState {
  if (status === ConsentStatus.PENDIENTE_FIRMA_MEDICO) return 'active';
  return 'done';
}
function getPatientStep(status: ConsentStatus): StepState {
  if (status === ConsentStatus.PENDIENTE_FIRMA_MEDICO) return 'waiting';
  if (status === ConsentStatus.FIRMADO_MEDICO) return 'active';
  if (status === ConsentStatus.ENVIADO_PACIENTE) return 'active';
  if (status === ConsentStatus.ACEPTADO) return 'accepted';
  if (status === ConsentStatus.RECHAZADO) return 'rejected';
  return 'waiting';
}

const STEP_STYLES: Record<StepState, { border: string; bg: string; iconColor: string; label: string }> = {
  done:     { border: 'rgba(27,122,107,0.30)',  bg: 'rgba(27,122,107,0.08)',  iconColor: '#1B7A6B', label: 'Firmado' },
  active:   { border: 'rgba(208,166,0,0.35)',   bg: 'rgba(208,166,0,0.08)',   iconColor: '#745b00', label: 'Pendiente' },
  waiting:  { border: '#e6e8e9',                bg: '#f2f4f4',                iconColor: '#bec9c5', label: 'En espera' },
  accepted: { border: 'rgba(27,122,107,0.30)',  bg: 'rgba(27,122,107,0.08)', iconColor: '#1B7A6B', label: 'Aceptado' },
  rejected: { border: 'rgba(186,26,26,0.30)',   bg: 'rgba(186,26,26,0.08)', iconColor: '#ba1a1a', label: 'Rechazado' },
};

function StepIcon({ state }: { state: StepState }) {
  const c = STEP_STYLES[state].iconColor;
  if (state === 'done')     return <CheckCircle2 size={18} style={{ color: c }} />;
  if (state === 'accepted') return <CheckCircle2 size={18} style={{ color: c }} />;
  if (state === 'rejected') return <XCircle      size={18} style={{ color: c }} />;
  if (state === 'active')   return <Clock        size={18} style={{ color: c }} />;
  return <AlertCircle size={18} style={{ color: c }} />;
}

interface ConsentPanelProps { orderId: string }

export function ConsentPanel({ orderId }: ConsentPanelProps) {
  const user = useAuthStore((s) => s.user);
  const { data: consent, isLoading, isError } = useConsent(orderId);

  const createMutation  = useCreateConsent(orderId);
  const signMutation    = useSignConsent(orderId);
  const sendMutation    = useSendConsent(orderId);
  const respondMutation = useRespondConsent(orderId);

  const [signNotes, setSignNotes]        = useState('');
  const [showDocument, setShowDocument]  = useState(false);
  const [confirmAction, setConfirmAction] = useState<'sign'|'send'|'accept'|'reject'|null>(null);

  const isAdmin    = user?.role === UserRole.ADMIN;
  const isOperador = user?.role === UserRole.OPERADOR;
  const isMedico   = user?.role === UserRole.MEDICO;

  const canCreate  = !consent && !isLoading && !isError && (isAdmin || isOperador || isMedico);
  const canSign    = (isAdmin || isMedico)               && consent?.status === ConsentStatus.PENDIENTE_FIRMA_MEDICO;
  const canSend    = (isAdmin || isMedico || isOperador) && consent?.status === ConsentStatus.FIRMADO_MEDICO;
  const canRespond = (isAdmin || isOperador)             && consent?.status === ConsentStatus.ENVIADO_PACIENTE;

  const isMutating = signMutation.isPending || sendMutation.isPending || respondMutation.isPending;

  function handleConfirm() {
    if (!confirmAction) return;
    const done = () => setConfirmAction(null);
    if (confirmAction === 'sign')   signMutation.mutate(signNotes || undefined, { onSuccess: done });
    if (confirmAction === 'send')   sendMutation.mutate(undefined, { onSuccess: done });
    if (confirmAction === 'accept') respondMutation.mutate('ACEPTADO', { onSuccess: done });
    if (confirmAction === 'reject') respondMutation.mutate('RECHAZADO', { onSuccess: done });
  }

  const status       = consent?.status as ConsentStatus | undefined;
  const doctorState  = status ? getDoctorStep(status) : 'waiting';
  const patientState = status ? getPatientStep(status) : 'waiting';
  const doctorStyle  = STEP_STYLES[doctorState];
  const patientStyle = STEP_STYLES[patientState];

  return (
    <>
      <Card padding="lg">
        <CardHeader
          title="Consentimiento informado"
          action={
            canCreate ? (
              <Button variant="outline" size="sm" loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}>
                <Plus size={14} className="mr-1" />Crear consentimiento
              </Button>
            ) : undefined
          }
        />

        {isLoading ? (
          <div className="mt-4"><LoadingSkeleton rows={3} /></div>
        ) : isError || !consent ? (
          <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: '#6e7976' }}>
            <FileText size={16} /><span>Sin consentimiento registrado.</span>
          </div>
        ) : (
          <div className="mt-5 space-y-5">

            {/* ── STEPPER: 2 firmas ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Paso 1: Firma médica */}
              <div className="rounded-xl p-4 border space-y-2"
                style={{ background: doctorStyle.bg, borderColor: doctorStyle.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: doctorStyle.border, color: '#fff' }}>1</div>
                    <span className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#6e7976' }}>Firma médica</span>
                  </div>
                  <StepIcon state={doctorState} />
                </div>
                <p className="text-sm font-semibold" style={{ color: doctorStyle.iconColor }}>
                  {doctorStyle.label}
                </p>
                {(consent.doctorNameSnapshot || consent.signedBy) && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#3e4946' }}>
                    <User size={12} />{consent.doctorNameSnapshot ?? consent.signedBy}
                  </div>
                )}
                {consent.signedAt && (
                  <p className="text-xs" style={{ color: '#6e7976' }}>{formatDate(consent.signedAt)}</p>
                )}
              </div>

              {/* Paso 2: Respuesta del paciente */}
              <div className="rounded-xl p-4 border space-y-2"
                style={{ background: patientStyle.bg, borderColor: patientStyle.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: patientStyle.border, color: '#fff' }}>2</div>
                    <span className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#6e7976' }}>Respuesta paciente</span>
                  </div>
                  <StepIcon state={patientState} />
                </div>
                <p className="text-sm font-semibold" style={{ color: patientStyle.iconColor }}>
                  {patientState === 'active' && status === ConsentStatus.FIRMADO_MEDICO
                    ? 'Pendiente envío'
                    : patientState === 'active' && status === ConsentStatus.ENVIADO_PACIENTE
                    ? 'Esperando respuesta'
                    : patientStyle.label}
                </p>
                {consent.patientNameSnapshot && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#3e4946' }}>
                    <UserCheck size={12} />{consent.patientNameSnapshot}
                  </div>
                )}
                {(consent.patientSignedAt ?? consent.respondedAt) && (
                  <p className="text-xs" style={{ color: '#6e7976' }}>
                    {formatDate(consent.patientSignedAt ?? consent.respondedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* ── Documento colapsable ── */}
            {consent.documentHtml && (
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#e6e8e9' }}>
                <button type="button" onClick={() => setShowDocument((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ background: '#f2f4f4', color: '#3e4946' }}>
                  <span className="flex items-center gap-2"><FileText size={14} />Documento de consentimiento</span>
                  {showDocument ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showDocument && (
                  <iframe
                    title="Documento de consentimiento"
                    sandbox="allow-same-origin"
                    srcDoc={consent.documentHtml}
                    className="w-full border-0"
                    style={{ minHeight: '380px', background: '#f8fafa', color: '#191c1d' }}
                  />
                )}
              </div>
            )}

            {/* PDF download */}
            {consent.documentPdfUrl && (
              <a href={consent.documentPdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-2"
                style={{ color: '#1B7A6B' }}>
                <Download size={14} />Descargar PDF firmado
              </a>
            )}

            {/* Notas de firma */}
            {canSign && (
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: '#3e4946' }}>
                  Notas de firma <span style={{ color: '#6e7976' }} className="font-normal">(opcional)</span>
                </label>
                <textarea rows={2} value={signNotes} onChange={(e) => setSignNotes(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                  placeholder="Ej. Firmado por el Dr. García"
                />
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              {canSign && (
                <Button variant="primary" size="sm" loading={signMutation.isPending}
                  onClick={() => setConfirmAction('sign')}>
                  <PenLine size={14} className="mr-1.5" />Firmar (Paso 1)
                </Button>
              )}
              {canSend && (
                <Button variant="secondary" size="sm" loading={sendMutation.isPending}
                  onClick={() => setConfirmAction('send')}>
                  <Send size={14} className="mr-1.5" />Enviar al paciente
                </Button>
              )}
              {canRespond && (
                <>
                  <Button variant="primary" size="sm" loading={respondMutation.isPending}
                    onClick={() => setConfirmAction('accept')}>
                    <CheckCircle2 size={14} className="mr-1.5" />Paciente acepta
                  </Button>
                  <Button variant="danger" size="sm" loading={respondMutation.isPending}
                    onClick={() => setConfirmAction('reject')}>
                    <XCircle size={14} className="mr-1.5" />Paciente rechaza
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        variant={confirmAction === 'reject' ? 'danger' : 'primary'}
        title={
          confirmAction === 'sign'   ? 'Firmar consentimiento (Paso 1)' :
          confirmAction === 'send'   ? 'Enviar al paciente' :
          confirmAction === 'accept' ? 'Confirmar aceptación' : 'Confirmar rechazo'
        }
        message={
          confirmAction === 'sign'   ? '¿Confirmas la firma médica del consentimiento informado?' :
          confirmAction === 'send'   ? '¿Enviar el consentimiento al paciente para su respuesta (Paso 2)?' :
          confirmAction === 'accept' ? '¿Registrar que el paciente aceptó el consentimiento?' :
                                       '¿Registrar que el paciente rechazó el consentimiento?'
        }
        confirmLabel="Confirmar"
        loading={isMutating}
      />
    </>
  );
}