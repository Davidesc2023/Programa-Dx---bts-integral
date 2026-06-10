'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Download, User, Beaker, RefreshCw, ShieldCheck, Info,
} from 'lucide-react';
import { getPortalConsentForOrder, acceptPortalConsent, rejectPortalConsent } from '@/services/portal.service';
import type { Consent } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';
import { ConsentStatus } from '@/types/enums';
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/SignaturePad';

export default function PortalConsentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [sigError, setSigError] = useState('');
  const sigRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    getPortalConsentForOrder(orderId)
      .then(setConsent)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [orderId]);

  const isResolved =
    consent?.status === ConsentStatus.ACEPTADO || consent?.status === ConsentStatus.RECHAZADO;

  const handleAccept = async () => {
    setSigError('');
    if (sigRef.current?.isEmpty()) {
      setSigError('Por favor dibuja tu firma antes de aceptar.');
      return;
    }
    if (!consent) return;
    setActionError(null);
    setActionLoading('accept');
    try {
      const updated = await acceptPortalConsent(consent.id);
      setConsent(updated);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!consent) return;
    setActionError(null);
    setActionLoading('reject');
    try {
      const updated = await rejectPortalConsent(consent.id);
      setConsent(updated);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setActionLoading(null);
    }
  };

  // ── extract patient + order data from consent ────────────────────────────
  const patient = (consent as { order?: { patient?: { firstName?: string; lastName?: string; documentType?: string; documentNumber?: string; birthDate?: string } | null; id?: string; physician?: string; doctorId?: string } | null } | null)?.order?.patient;
  const order = (consent as { order?: { id?: string; physician?: string } | null } | null)?.order;
  const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
  const doctorName = (consent as { doctorNameSnapshot?: string | null } | null)?.doctorNameSnapshot ?? consent?.['signedBy'] ?? 'Médico';
  const tests = (consent as { order?: { tests?: { id: string; examName: string; examCode: string; notes?: string | null }[] } | null } | null)?.order?.tests ?? [];

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f8fafa', fontFamily: 'Inter, sans-serif', color: '#191c1d' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-16"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(25,28,29,0.04)' }}>
        <Link href={`/portal/orders/${orderId}`}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#1B7A6B' }}>
          <ChevronLeft size={16} />Volver a la orden
        </Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(157,242,224,0.30)' }}>
          <ShieldCheck size={16} style={{ color: '#006053' }} />
        </div>
      </header>

      <main className="pt-8 px-4 max-w-2xl mx-auto space-y-6">

        {/* Hero */}
        <section className="space-y-1">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#0061a3' }}>Verificación Requerida</span>
          <h1 className="text-2xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Documento de Consentimiento Informado
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6e7976' }}>
            Revise cuidadosamente la información médica y los exámenes seleccionados antes de proceder con su autorización.
          </p>
        </section>

        {error && (
          <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
            style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.20)', color: '#ba1a1a' }}>
            <AlertCircle size={16} />{error}
          </div>
        )}

        {!consent && !error && (
          <div className="text-sm" style={{ color: '#6e7976' }}>Cargando consentimiento...</div>
        )}

        {consent && (
          <>
            {/* Patient + Order info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient */}
              <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(190,201,197,0.15)', boxShadow: '0 4px 20px rgba(25,28,29,0.03)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(27,122,107,0.08)' }}>
                    <User size={20} style={{ color: '#1B7A6B' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6e7976' }}>Paciente</p>
                    <h3 className="font-bold text-base" style={{ fontFamily: 'Manrope, sans-serif' }}>{patientName || '—'}</h3>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {patient?.documentType && patient?.documentNumber && (
                    <div className="flex justify-between">
                      <span style={{ color: '#6e7976' }}>Documento:</span>
                      <span className="font-medium">{patient.documentType} {patient.documentNumber}</span>
                    </div>
                  )}
                  {patient?.birthDate && (
                    <div className="flex justify-between">
                      <span style={{ color: '#6e7976' }}>Nacimiento:</span>
                      <span className="font-medium">{new Date(patient.birthDate).toLocaleDateString('es-CO')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order */}
              <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(190,201,197,0.15)', boxShadow: '0 4px 20px rgba(25,28,29,0.03)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,97,163,0.08)' }}>
                    <Beaker size={20} style={{ color: '#0061a3' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6e7976' }}>Orden Médica</p>
                    <h3 className="font-bold text-sm font-mono" style={{ color: '#191c1d' }}>
                      #{orderId.substring(0, 8).toUpperCase()}
                    </h3>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#6e7976' }}>Médico:</span>
                    <span className="font-medium">{doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6e7976' }}>Estado:</span>
                    <ConsentBadge status={consent.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Exams list */}
            {tests.length > 0 && (
              <section className="rounded-xl p-5" style={{ background: 'rgba(242,244,244,0.80)', border: '1px solid rgba(190,201,197,0.15)' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#6e7976' }}>Exámenes Solicitados</h2>
                <div className="space-y-2">
                  {tests.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg p-3.5"
                      style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center gap-3">
                        <Beaker size={18} style={{ color: '#1B7A6B' }} />
                        <div>
                          <p className="text-sm font-bold">{t.examName}</p>
                          {t.notes && <p className="text-xs mt-0.5" style={{ color: '#6e7976' }}>{t.notes}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: 'rgba(157,242,224,0.50)', color: '#005045' }}>
                        Confirmado
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Document viewer */}
            {consent.documentHtml && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(190,201,197,0.20)' }}>
                <button
                  onClick={() => setShowDocument((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium transition-colors"
                  style={{ background: 'rgba(242,244,244,0.80)', color: '#3e4946' }}>
                  <span>Leer documento de consentimiento completo</span>
                  {showDocument ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showDocument && (
                  <iframe
                    srcDoc={consent.documentHtml}
                    sandbox="allow-same-origin"
                    className="w-full border-0"
                    style={{ minHeight: 380, background: '#fff' }}
                    title="Documento de consentimiento"
                  />
                )}
              </div>
            )}

            {/* Declaration */}
            <article className="text-sm leading-relaxed px-1" style={{ color: '#6e7976' }}>
              <h3 className="font-bold mb-2" style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}>Declaración del Paciente</h3>
              <p>
                He sido informado sobre la naturaleza y el propósito de los exámenes mencionados anteriormente. Entiendo que estos procedimientos son necesarios para mi diagnóstico médico y autorizo al personal de <strong style={{ color: '#191c1d' }}>BTS Integral</strong> a realizar la toma de muestras correspondiente siguiendo los protocolos de bioseguridad vigentes.
              </p>
              <p className="mt-2">Acepto que los resultados sean enviados a mi médico tratante y cargados en mi portal personal de salud.</p>
            </article>

            {/* Resolved state */}
            {consent.status === ConsentStatus.ACEPTADO && (
              <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-sm"
                style={{ background: 'rgba(27,122,107,0.06)', border: '1px solid rgba(27,122,107,0.20)', color: '#005045' }}>
                <CheckCircle size={18} style={{ color: '#1B7A6B' }} />
                <span className="font-medium">Has aceptado este consentimiento.{consent.patientSignedAt ? ` (${new Date(consent.patientSignedAt as unknown as string).toLocaleString('es-CO')})` : ''}</span>
              </div>
            )}
            {consent.status === ConsentStatus.RECHAZADO && (
              <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-sm"
                style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.20)', color: '#ba1a1a' }}>
                <XCircle size={18} />
                <span className="font-medium">Has rechazado este consentimiento.</span>
              </div>
            )}

            {/* PDF download */}
            {consent.documentPdfUrl && (
              <a href={consent.documentPdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: '#1B7A6B' }}>
                <Download size={15} />Descargar PDF del consentimiento firmado
              </a>
            )}

            {/* Signature + action (only if not resolved) */}
            {!isResolved && (
              <section className="space-y-4 pt-2">
                {/* Signature pad */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#191c1d' }}>Firma Digital</h3>
                    <button
                      type="button"
                      onClick={() => sigRef.current?.clear()}
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: '#0061a3' }}>
                      <RefreshCw size={12} /> Limpiar
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden relative"
                    style={{
                      height: 192,
                      border: '2px dashed rgba(190,201,197,0.40)',
                      background: '#fff',
                      backgroundImage: 'radial-gradient(circle, #bec9c5 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-px" style={{ background: 'rgba(190,201,197,0.50)' }} />
                    <SignaturePad ref={sigRef} className="absolute inset-0" />
                  </div>
                  {sigError && (
                    <p className="text-xs mt-1.5 font-medium" style={{ color: '#ba1a1a' }}>{sigError}</p>
                  )}
                </div>

                {/* Habeas Data notice */}
                <div className="flex gap-3 items-start rounded-xl p-4" style={{ background: 'rgba(242,244,244,0.80)' }}>
                  <Info size={18} style={{ color: '#745b00', flexShrink: 0 }} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#191c1d' }}>Aviso de Privacidad (Habeas Data)</h4>
                    <p className="text-xs leading-relaxed" style={{ color: '#6e7976' }}>
                      De conformidad con la Ley 1581 de 2012, autorizo de manera previa, expresa e informada a BTS Integral para el tratamiento de mis datos personales y sensibles con fines médicos y estadísticos.
                    </p>
                  </div>
                </div>

                {actionError && (
                  <p className="text-sm font-medium" style={{ color: '#ba1a1a' }}>{actionError}</p>
                )}

                {/* Accept / Reject */}
                <div className="grid grid-cols-2 gap-3 pb-4">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading !== null}
                    className="h-14 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: 'rgba(236,238,238,0.80)', color: '#ba1a1a' }}>
                    {actionLoading === 'reject' ? 'Rechazando...' : 'Rechazar'}
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading !== null}
                    className="h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: '#1b7a6b', color: '#fff', fontFamily: 'Manrope, sans-serif', boxShadow: '0 8px 24px rgba(27,122,107,0.25)' }}>
                    <CheckCircle size={16} />
                    {actionLoading === 'accept' ? 'Aceptando...' : 'Aceptar y Firmar'}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-10 text-center space-y-2">
        <p className="text-xs font-black tracking-tighter" style={{ color: 'rgba(25,28,29,0.15)', fontFamily: 'Manrope, sans-serif' }}>BTS Integral</p>
        <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(62,73,70,0.30)' }}>Sanctuary Health-Tech Ecosystem</p>
      </footer>

      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'rgba(157,242,224,0.40)', transform: 'translate(50%, -50%)' }} />
      <div className="fixed bottom-0 left-0 -z-10 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'rgba(209,228,255,0.40)', transform: 'translate(-50%, 50%)' }} />
    </div>
  );
}

function ConsentBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDIENTE_FIRMA_MEDICO: { bg: 'rgba(236,238,238,0.80)', color: '#6e7976', label: 'Pendiente firma médico' },
    FIRMADO_MEDICO: { bg: 'rgba(209,228,255,0.50)', color: '#0061a3', label: 'Firmado por médico' },
    ENVIADO_PACIENTE: { bg: 'rgba(255,224,139,0.50)', color: '#584400', label: 'Pendiente tu respuesta' },
    ACEPTADO: { bg: 'rgba(157,242,224,0.40)', color: '#005045', label: 'Aceptado' },
    RECHAZADO: { bg: 'rgba(255,218,214,0.50)', color: '#ba1a1a', label: 'Rechazado' },
  };
  const s = map[status] ?? { bg: 'rgba(236,238,238,0.80)', color: '#6e7976', label: status };
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}
