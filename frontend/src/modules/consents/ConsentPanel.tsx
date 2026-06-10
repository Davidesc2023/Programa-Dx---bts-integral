'use client';

import { useRef, useState } from 'react';
import {
  FileText, PenLine, Send, CheckCircle2, XCircle, Plus, Download,
  ChevronDown, ChevronUp, User, UserCheck, Clock, AlertCircle, X, RefreshCw,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/SignaturePad';
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

// ── Static consent legal text preview (shown before signing) ─────────────────
function ConsentDocumentPreview({ patientName, patientDoc, doctorName, doctorSpecialty, doctorLicense, orderId }: {
  patientName: string; patientDoc: string; doctorName: string;
  doctorSpecialty?: string | null; doctorLicense?: string | null; orderId: string;
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10.5pt', color: '#111', lineHeight: 1.6, padding: '16px' }}>
      <h1 style={{ fontSize: '14pt', textAlign: 'center', marginBottom: 4 }}>Consentimiento Informado para Exámenes de Laboratorio</h1>
      <p style={{ textAlign: 'center', color: '#555', fontSize: '9.5pt', marginBottom: 24 }}>Documento legal — Ley 1581 de 2012 (Colombia)</p>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 3, marginBottom: 8, textTransform: 'uppercase' }}>Datos de la Orden</h2>
        <p><strong>Número de orden:</strong> <code style={{ fontSize: '9pt', color: '#666' }}>{orderId}</code></p>
        <p><strong>Fecha estimada:</strong> {new Date().toLocaleDateString('es-CO')}</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 3, marginBottom: 8, textTransform: 'uppercase' }}>Médico Tratante</h2>
        <p><strong>Nombre:</strong> {doctorName}</p>
        {doctorSpecialty && <p><strong>Especialidad:</strong> {doctorSpecialty}</p>}
        {doctorLicense && <p><strong>Registro médico:</strong> {doctorLicense}</p>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 3, marginBottom: 8, textTransform: 'uppercase' }}>Datos del Paciente</h2>
        <p><strong>Nombre completo:</strong> {patientName || '[Paciente de la orden]'}</p>
        <p><strong>Documento:</strong> {patientDoc || '—'}</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 3, marginBottom: 8, textTransform: 'uppercase' }}>Declaración de Consentimiento</h2>
        <div style={{ fontSize: '9.5pt', color: '#333', textAlign: 'justify' }}>
          <p style={{ marginBottom: 8 }}>
            Yo, <strong>{patientName || 'el paciente'}</strong>, declaro de manera libre, voluntaria y consciente que el médico tratante, <strong>{doctorName}</strong>, me ha informado de manera clara y comprensible sobre:
          </p>
          <p style={{ marginBottom: 8 }}>a) La naturaleza de los exámenes de laboratorio clínico a realizar, sus propósitos diagnósticos y el procedimiento de toma de muestras biológicas.</p>
          <p style={{ marginBottom: 8 }}>b) Los posibles riesgos, molestias o incomodidades asociadas al procedimiento de recolección de muestras, incluyendo pero no limitadas a: punción venosa, molestias transitorias, hematomas o mareos.</p>
          <p style={{ marginBottom: 8 }}>c) Los beneficios esperados de los exámenes en relación con mi diagnóstico y tratamiento médico.</p>
          <p style={{ marginBottom: 8 }}>d) Alternativas diagnósticas disponibles y las razones por las que se recomiendan los presentes exámenes.</p>
          <p style={{ marginBottom: 8 }}>e) El manejo confidencial de mis datos personales y resultados de salud, conforme a la <strong>Ley 1581 de 2012</strong> y la <strong>Resolución 1995 de 1999</strong>.</p>
          <p style={{ marginBottom: 8 }}>En pleno uso de mis facultades mentales, y habiendo tenido la oportunidad de formular preguntas que fueron respondidas satisfactoriamente, <strong>OTORGO MI CONSENTIMIENTO</strong> para la realización de los exámenes de laboratorio indicados en la presente orden.</p>
          <p>Entiendo que puedo revocar este consentimiento en cualquier momento antes del inicio del procedimiento, sin que ello ocasione consecuencias negativas en mi atención médica.</p>
        </div>
      </div>

      <div style={{ fontSize: '8pt', color: '#888', textAlign: 'center', marginTop: 24, borderTop: '1px solid #eee', paddingTop: 12 }}>
        Documento generado automáticamente · Orden {orderId} · Validez legal conforme a la Ley 527 de 1999 (Comercio Electrónico — Colombia)
      </div>
    </div>
  );
}

// ── Doctor Sign Modal ─────────────────────────────────────────────────────────
function DoctorSignModal({ orderId, consent, userEmail, onClose, onSigned }: {
  orderId: string;
  consent: {
    order?: {
      patient?: { firstName?: string; lastName?: string; documentType?: string; documentNumber?: string } | null;
    } | null;
    doctor?: { firstName?: string | null; lastName?: string | null; specialty?: string | null; medicalLicense?: string | null } | null;
  };
  userEmail: string;
  onClose: () => void;
  onSigned: (payload: { notes?: string; signatureDataUrl?: string | null }) => void;
}) {
  const sigRef = useRef<SignaturePadHandle>(null);
  const [accepted, setAccepted] = useState(false);
  const [notes, setNotes] = useState('');
  const [sigError, setSigError] = useState('');

  const patientName = [consent?.order?.patient?.firstName, consent?.order?.patient?.lastName].filter(Boolean).join(' ');
  const patientDoc = [consent?.order?.patient?.documentType, consent?.order?.patient?.documentNumber].filter(Boolean).join(' N.° ');
  const doctorName = [consent?.doctor?.firstName, consent?.doctor?.lastName].filter(Boolean).join(' ') || userEmail;

  const handleSign = () => {
    setSigError('');
    if (!accepted) { setSigError('Debes aceptar los términos del consentimiento.'); return; }
    if (sigRef.current?.isEmpty()) { setSigError('Por favor dibuja tu firma en el recuadro.'); return; }
    const signatureDataUrl = sigRef.current?.getDataUrl() ?? null;
    onSigned({ notes: notes || undefined, signatureDataUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(25,28,29,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#fff', boxShadow: '0 32px 64px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e6e8e9' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(27,122,107,0.10)' }}>
              <FileText size={18} style={{ color: '#1B7A6B' }} />
            </div>
            <div>
              <h2 className="font-extrabold text-base" style={{ fontFamily: 'Manrope, sans-serif', color: '#191c1d' }}>
                Consentimiento Legal e Informado
              </h2>
              <p className="text-xs" style={{ color: '#6e7976' }}>Revise el documento completo antes de firmar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-gray-100">
            <X size={18} style={{ color: '#6e7976' }} />
          </button>
        </div>

        {/* Body: 2-column bento */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: document */}
          <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: '#e6e8e9' }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-2 text-xs font-bold uppercase tracking-widest z-10"
              style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', color: '#1B7A6B', borderBottom: '1px solid #e6e8e9' }}>
              <span>Documento Oficial</span>
              <span style={{ color: '#bec9c5', fontWeight: 400 }}>Versión 2.4</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
              <ConsentDocumentPreview
                patientName={patientName}
                patientDoc={patientDoc}
                doctorName={doctorName}
                doctorSpecialty={consent?.doctor?.specialty}
                doctorLicense={consent?.doctor?.medicalLicense}
                orderId={orderId}
              />
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="w-80 flex flex-col gap-4 p-5 overflow-y-auto">

            {/* Doctor info card */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(209,228,255,0.20)', border: '1px solid rgba(209,228,255,0.50)' }}>
              <div className="flex gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <User size={20} style={{ color: '#0061a3' }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6e7976' }}>Médico firmante</p>
                  <p className="font-bold text-sm" style={{ color: '#191c1d' }}>{doctorName}</p>
                  {consent?.doctor?.medicalLicense && <p className="text-xs" style={{ color: '#0061a3' }}>TP: {consent.doctor.medicalLicense}</p>}
                </div>
              </div>
              <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'rgba(209,228,255,0.50)' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#6e7976' }}>Fecha:</span>
                  <span className="font-semibold" style={{ color: '#191c1d' }}>
                    {new Date().toLocaleDateString('es-CO')}
                  </span>
                </div>
                {consent?.doctor?.specialty && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#6e7976' }}>Especialidad:</span>
                    <span className="font-semibold text-right" style={{ color: '#191c1d', maxWidth: 140 }}>{consent.doctor.specialty}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature pad */}
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e6e8e9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: '#191c1d' }}>Firma Digital</h3>
                <button
                  type="button"
                  onClick={() => sigRef.current?.clear()}
                  className="flex items-center gap-1 text-xs font-semibold transition-colors"
                  style={{ color: '#ba1a1a' }}>
                  <RefreshCw size={12} /> Limpiar
                </button>
              </div>
              <div className="rounded-lg overflow-hidden relative"
                style={{
                  height: 160,
                  border: '2px dashed #bec9c5',
                  backgroundImage: 'repeating-linear-gradient(#f1f5f9 0px, #f1f5f9 1px, transparent 1px, transparent 20px)',
                  backgroundSize: '100% 20px',
                }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                  <PenLine size={56} style={{ color: '#1B7A6B' }} />
                </div>
                <SignaturePad ref={sigRef} className="absolute inset-0" />
              </div>
              <p className="text-center mt-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#6e7976' }}>
                Dibuje su firma en el recuadro
              </p>
            </div>

            {/* Accept terms */}
            <label className="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-colors hover:bg-gray-50"
              style={{ border: '1px solid #e6e8e9' }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded"
                style={{ accentColor: '#006053' }}
              />
              <span className="text-sm font-medium" style={{ color: '#191c1d' }}>
                He leído y acepto el consentimiento informado.
                <span className="block text-xs font-normal mt-0.5" style={{ color: '#6e7976' }}>
                  Confirmo que he revisado todas las cláusulas legales.
                </span>
              </span>
            </label>

            {/* Notes */}
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales (opcional)"
              className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
              style={{ border: '1px solid #e6e8e9', color: '#191c1d', background: '#f8fafa' }}
            />

            {sigError && (
              <p className="text-xs font-medium" style={{ color: '#ba1a1a' }}>{sigError}</p>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleSign}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: '#006053', color: '#fff', fontFamily: 'Manrope, sans-serif', boxShadow: '0 8px 24px rgba(0,96,83,0.25)' }}>
              <PenLine size={16} />
              Firmar y Continuar
            </button>

            <p className="text-center text-xs leading-tight" style={{ color: '#6e7976' }}>
              Al firmar, se generará un registro con sello de tiempo vinculado a su identidad profesional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ConsentPanel ─────────────────────────────────────────────────────────
interface ConsentPanelProps { orderId: string }

export function ConsentPanel({ orderId }: ConsentPanelProps) {
  const user = useAuthStore((s) => s.user);
  const { data: consent, isLoading, isError } = useConsent(orderId);

  const createMutation  = useCreateConsent(orderId);
  const signMutation    = useSignConsent(orderId);
  const sendMutation    = useSendConsent(orderId);
  const respondMutation = useRespondConsent(orderId);

  const [showDocument, setShowDocument]  = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'send' | 'accept' | 'reject' | null>(null);

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
    if (confirmAction === 'send')   sendMutation.mutate(undefined, { onSuccess: done });
    if (confirmAction === 'accept') respondMutation.mutate('ACEPTADO', { onSuccess: done });
    if (confirmAction === 'reject') respondMutation.mutate('RECHAZADO', { onSuccess: done });
  }

  function handleSigned(payload: { notes?: string; signatureDataUrl?: string | null }) {
    setShowSignModal(false);
    signMutation.mutate(payload);
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

            {/* ── STEPPER: 2 pasos ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Paso 1: Firma médica */}
              <div className="rounded-xl p-4 border space-y-2"
                style={{ background: doctorStyle.bg, borderColor: doctorStyle.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: doctorStyle.border, color: '#fff' }}>1</div>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6e7976' }}>Firma médica</span>
                  </div>
                  <StepIcon state={doctorState} />
                </div>
                <p className="text-sm font-semibold" style={{ color: doctorStyle.iconColor }}>{doctorStyle.label}</p>
                {consent.doctorNameSnapshot && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#3e4946' }}>
                    <User size={12} />{consent.doctorNameSnapshot}
                  </div>
                )}
                {consent.doctorSignedAt && (
                  <p className="text-xs" style={{ color: '#6e7976' }}>{formatDate(consent.doctorSignedAt)}</p>
                )}
              </div>

              {/* Paso 2: Respuesta del paciente */}
              <div className="rounded-xl p-4 border space-y-2"
                style={{ background: patientStyle.bg, borderColor: patientStyle.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: patientStyle.border, color: '#fff' }}>2</div>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6e7976' }}>Respuesta paciente</span>
                  </div>
                  <StepIcon state={patientState} />
                </div>
                <p className="text-sm font-semibold" style={{ color: patientStyle.iconColor }}>
                  {patientState === 'active' && status === ConsentStatus.FIRMADO_MEDICO ? 'Pendiente envío'
                    : patientState === 'active' && status === ConsentStatus.ENVIADO_PACIENTE ? 'Esperando respuesta'
                    : patientStyle.label}
                </p>
                {consent.patientNameSnapshot && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#3e4946' }}>
                    <UserCheck size={12} />{consent.patientNameSnapshot}
                  </div>
                )}
                {consent.patientSignedAt && (
                  <p className="text-xs" style={{ color: '#6e7976' }}>
                    {formatDate(consent.patientSignedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* ── Documento colapsable (post-firma) ── */}
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
                    style={{ minHeight: '380px', background: '#f8fafa' }}
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

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              {canSign && (
                <Button variant="primary" size="sm" loading={signMutation.isPending}
                  onClick={() => setShowSignModal(true)}>
                  <PenLine size={14} className="mr-1.5" />Revisar y Firmar (Paso 1)
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

      {/* Doctor sign modal */}
      {showSignModal && consent && (
        <DoctorSignModal
          orderId={orderId}
          consent={consent}
          userEmail={user?.email ?? ''}
          onClose={() => setShowSignModal(false)}
          onSigned={handleSigned}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        variant={confirmAction === 'reject' ? 'danger' : 'primary'}
        title={
          confirmAction === 'send'   ? 'Enviar al paciente' :
          confirmAction === 'accept' ? 'Confirmar aceptación' : 'Confirmar rechazo'
        }
        message={
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
