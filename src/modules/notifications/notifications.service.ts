import { Injectable, Logger } from '@nestjs/common';

interface PatientNotificationData {
  orderId: string;
  patientEmail: string | null | undefined;
  patientName: string;
}

interface DoctorNotificationData {
  orderId: string;
  doctorEmail: string | null | undefined;
  patientName: string;
  response: 'ACEPTADO' | 'RECHAZADO';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyConsentSentToPatient(
    data: PatientNotificationData,
  ): Promise<void> {
    if (!data.patientEmail) {
      this.logger.warn(
        `[NOTIF] Sin email para paciente en orden ${data.orderId} — omitiendo notificación de consentimiento`,
      );
      return;
    }

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">Consentimiento Informado Pendiente</h2>
  <p>Estimado/a <strong>${data.patientName}</strong>,</p>
  <p>Se ha generado una solicitud de consentimiento informado para su orden de laboratorio <strong>#${data.orderId}</strong>.</p>
  <p>Por favor, revise los detalles con su operador y proceda a confirmar o rechazar la solicitud.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb;" />
  <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">Mensaje automático — Sistema APP-DX. No responder a este correo.</p>
</div>`.trim();

    this.logger.log(
      `[NOTIF STUB] → Para: ${data.patientEmail} | Asunto: Consentimiento pendiente — Orden #${data.orderId} | Cuerpo HTML preparado`,
    );
    this.logger.debug(`[NOTIF STUB] HTML:\n${html}`);
  }

  async notifyConsentResponded(data: DoctorNotificationData): Promise<void> {
    if (!data.doctorEmail) {
      this.logger.warn(
        `[NOTIF] Sin email de médico para orden ${data.orderId} — omitiendo notificación de respuesta`,
      );
      return;
    }

    const isAccepted = data.response === 'ACEPTADO';
    const subject = isAccepted
      ? `Consentimiento ACEPTADO — Orden #${data.orderId}`
      : `Consentimiento RECHAZADO — Orden #${data.orderId}`;

    const statusColor = isAccepted ? '#16a34a' : '#dc2626';
    const statusLabel = isAccepted ? 'ACEPTADO ✓' : 'RECHAZADO ✗';
    const statusMessage = isAccepted
      ? 'La orden está lista para continuar con la toma de muestras.'
      : 'El proceso ha sido detenido según la decisión del paciente.';

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">Respuesta de Consentimiento Registrada</h2>
  <p>El paciente <strong>${data.patientName}</strong> ha respondido el consentimiento de la orden <strong>#${data.orderId}</strong>.</p>
  <p>Estado: <strong style="color: ${statusColor};">${statusLabel}</strong></p>
  <p>${statusMessage}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb;" />
  <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">Mensaje automático — Sistema APP-DX. No responder a este correo.</p>
</div>`.trim();

    this.logger.log(
      `[NOTIF STUB] → Para: ${data.doctorEmail} | Asunto: ${subject} | Cuerpo HTML preparado`,
    );
    this.logger.debug(`[NOTIF STUB] HTML:\n${html}`);
  }
}
