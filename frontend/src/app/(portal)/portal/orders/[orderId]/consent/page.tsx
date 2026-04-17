'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { getPortalConsentForOrder, acceptPortalConsent, rejectPortalConsent } from '@/services/portal.service';
import type { Consent } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';
import { ConsentStatus } from '@/types/enums';

export default function PortalConsentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);

  useEffect(() => {
    getPortalConsentForOrder(orderId)
      .then(setConsent)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [orderId]);

  const handleAccept = async () => {
    if (!consent) return;
    setActionError(null);
    setActionLoading('accept');
    try {
      const updated = await acceptPortalConsent(consent.id, notes || undefined);
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
      const updated = await rejectPortalConsent(consent.id, notes || undefined);
      setConsent(updated);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setActionLoading(null);
    }
  };

  const isResolved =
    consent?.status === ConsentStatus.ACEPTADO || consent?.status === ConsentStatus.RECHAZADO;

  return (
    <div>
      <Link
        href={`/portal/orders/${orderId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Volver a la orden
      </Link>

      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Consentimiento informado</h1>
      <p className="text-sm text-gray-500 mb-6">
        Lee el consentimiento y acepta o rechaza según corresponds.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!consent && !error && <p className="text-sm text-gray-500">Cargando consentimiento...</p>}

      {consent && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Estado:</span>
            <ConsentBadge status={consent.status} />
          </div>

          {consent.signedBy && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Firmado por:</span> {consent.signedBy}
            </p>
          )}

          {/* Documento del consentimiento — disponible cuando el médico ha firmado */}
          {consent.documentHtml && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowDocument((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
              >
                <span>Leer documento de consentimiento</span>
                {showDocument ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showDocument && (
                <iframe
                  srcDoc={consent.documentHtml}
                  sandbox="allow-same-origin"
                  className="w-full h-96 border-0"
                  title="Documento de consentimiento"
                />
              )}
            </div>
          )}

          {/* Link de descarga PDF — disponible una vez aceptado */}
          {consent.documentPdfUrl && (
            <a
              href={consent.documentPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Download size={15} />
              Descargar PDF del consentimiento firmado
            </a>
          )}

          {/* Resolved message */}
          {consent.status === ConsentStatus.ACEPTADO && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <CheckCircle size={16} />
              Has aceptado este consentimiento.
              {consent.respondedAt &&
                ` (${new Date(consent.respondedAt).toLocaleString('es-CO')})`}
            </div>
          )}
          {consent.status === ConsentStatus.RECHAZADO && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <XCircle size={16} />
              Has rechazado este consentimiento.
              {consent.respondedAt &&
                ` (${new Date(consent.respondedAt).toLocaleString('es-CO')})`}
            </div>
          )}

          {/* Action section */}
          {!isResolved && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm text-gray-700">
                Por favor revisa el consentimiento con tu médico y luego indica tu respuesta:
              </p>
              <textarea
                rows={3}
                placeholder="Observaciones opcionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />

              {actionError && (
                <p className="text-sm text-red-600">{actionError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  <CheckCircle size={16} />
                  {actionLoading === 'accept' ? 'Aceptando...' : 'Aceptar'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  <XCircle size={16} />
                  {actionLoading === 'reject' ? 'Rechazando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConsentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDIENTE_FIRMA_MEDICO: 'bg-gray-100 text-gray-600',
    FIRMADO_MEDICO: 'bg-blue-100 text-blue-700',
    ENVIADO_PACIENTE: 'bg-yellow-100 text-yellow-700',
    ACEPTADO: 'bg-green-100 text-green-700',
    RECHAZADO: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    PENDIENTE_FIRMA_MEDICO: 'Pendiente firma médico',
    FIRMADO_MEDICO: 'Firmado por médico',
    ENVIADO_PACIENTE: 'Pendiente tu respuesta',
    ACEPTADO: 'Aceptado',
    RECHAZADO: 'Rechazado',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}
