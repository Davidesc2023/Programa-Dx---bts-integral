'use client';

import { useState } from 'react';
import { FileText, PenLine, Send, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useConsent,
  useCreateConsent,
  useSignConsent,
  useSendConsent,
  useRespondConsent,
} from './useConsent';
import { useAuthStore } from '@/modules/auth/authStore';
import { CONSENT_STATUS_LABELS, ConsentStatus, UserRole } from '@/types/enums';
import type { BadgeVariant } from '@/components/ui/Badge';

const STATUS_BADGE: Record<ConsentStatus, BadgeVariant> = {
  [ConsentStatus.PENDIENTE_FIRMA_MEDICO]: 'warning',
  [ConsentStatus.FIRMADO_MEDICO]: 'info',
  [ConsentStatus.ENVIADO_PACIENTE]: 'purple',
  [ConsentStatus.ACEPTADO]: 'success',
  [ConsentStatus.RECHAZADO]: 'danger',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface ConsentPanelProps {
  orderId: string;
}

export function ConsentPanel({ orderId }: ConsentPanelProps) {
  const user = useAuthStore((s) => s.user);
  const { data: consent, isLoading, isError } = useConsent(orderId);

  const createMutation = useCreateConsent(orderId);
  const signMutation = useSignConsent(orderId);
  const sendMutation = useSendConsent(orderId);
  const respondMutation = useRespondConsent(orderId);

  const [signNotes, setSignNotes] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    'sign' | 'send' | 'accept' | 'reject' | null
  >(null);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOperador = user?.role === UserRole.OPERADOR;
  const isMedico = user?.role === UserRole.MEDICO;

  const canSign = (isAdmin || isMedico) && consent?.status === ConsentStatus.PENDIENTE_FIRMA_MEDICO;
  const canSend = (isAdmin || isMedico || isOperador) && consent?.status === ConsentStatus.FIRMADO_MEDICO;
  const canRespond = (isAdmin || isOperador) && consent?.status === ConsentStatus.ENVIADO_PACIENTE;

  function handleConfirm() {
    if (!confirmAction) return;
    switch (confirmAction) {
      case 'sign':
        signMutation.mutate(signNotes || undefined, { onSuccess: () => setConfirmAction(null) });
        break;
      case 'send':
        sendMutation.mutate(undefined, { onSuccess: () => setConfirmAction(null) });
        break;
      case 'accept':
        respondMutation.mutate('ACEPTADO', { onSuccess: () => setConfirmAction(null) });
        break;
      case 'reject':
        respondMutation.mutate('RECHAZADO', { onSuccess: () => setConfirmAction(null) });
        break;
    }
  }

  const isMutating =
    signMutation.isPending ||
    sendMutation.isPending ||
    respondMutation.isPending;

  return (
    <>
      <Card padding="lg">
        <CardHeader
          title="Consentimiento informado"
          action={
            !consent && !isLoading && !isError && (isAdmin || isOperador || isMedico) ? (
              <Button
                variant="outline"
                size="sm"
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                <Plus size={14} className="mr-1" />
                Crear consentimiento
              </Button>
            ) : undefined
          }
        />

        {isLoading ? (
          <div className="mt-4">
            <LoadingSkeleton rows={4} />
          </div>
        ) : isError || !consent ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <FileText size={16} />
            <span>Sin consentimiento registrado.</span>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_BADGE[consent.status as ConsentStatus]}>
                {CONSENT_STATUS_LABELS[consent.status as ConsentStatus]}
              </Badge>
            </div>

            {/* Details */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {consent.signedBy && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Firmado por</dt>
                  <dd className="text-gray-900">{consent.signedBy}</dd>
                </div>
              )}
              {consent.signedAt && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Fecha firma</dt>
                  <dd className="text-gray-900">{formatDate(consent.signedAt)}</dd>
                </div>
              )}
              {consent.patientResponse && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Respuesta paciente</dt>
                  <dd className="text-gray-900">{consent.patientResponse}</dd>
                </div>
              )}
              {consent.respondedAt && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Fecha respuesta</dt>
                  <dd className="text-gray-900">{formatDate(consent.respondedAt)}</dd>
                </div>
              )}
            </dl>

            {/* Sign notes input */}
            {canSign && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Notas de firma <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={signNotes}
                  onChange={(e) => setSignNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Ej. Firmado por el Dr. García"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {canSign && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={signMutation.isPending}
                  onClick={() => setConfirmAction('sign')}
                >
                  <PenLine size={14} className="mr-1.5" />
                  Firmar
                </Button>
              )}
              {canSend && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={sendMutation.isPending}
                  onClick={() => setConfirmAction('send')}
                >
                  <Send size={14} className="mr-1.5" />
                  Enviar al paciente
                </Button>
              )}
              {canRespond && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={respondMutation.isPending}
                    onClick={() => setConfirmAction('accept')}
                  >
                    <CheckCircle2 size={14} className="mr-1.5" />
                    Paciente acepta
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={respondMutation.isPending}
                    onClick={() => setConfirmAction('reject')}
                  >
                    <XCircle size={14} className="mr-1.5" />
                    Paciente rechaza
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
          confirmAction === 'sign'
            ? 'Firmar consentimiento'
            : confirmAction === 'send'
            ? 'Enviar al paciente'
            : confirmAction === 'accept'
            ? 'Confirmar aceptación'
            : 'Confirmar rechazo'
        }
        message={
          confirmAction === 'sign'
            ? '¿Confirmas la firma del consentimiento informado?'
            : confirmAction === 'send'
            ? '¿Enviar el consentimiento al paciente para su respuesta?'
            : confirmAction === 'accept'
            ? '¿Registrar que el paciente aceptó el consentimiento?'
            : '¿Registrar que el paciente rechazó el consentimiento?'
        }
        confirmLabel="Confirmar"
        loading={isMutating}
      />
    </>
  );
}
