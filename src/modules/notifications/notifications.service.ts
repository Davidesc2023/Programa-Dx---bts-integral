import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

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

interface ResultReadyData {
  orderId: string;
  patientEmail: string | null | undefined;
  patientName: string;
  doctorEmail: string | null | undefined;
  doctorName: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail =
      process.env.RESEND_FROM_EMAIL ?? 'APP-DX <noreply@bts-dx.app>';

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY no configurada — notificaciones en modo logger (desarrollo)',
      );
    }
  }

  private async sendEmail(opts: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.log(
        `[NOTIF LOG] → Para: ${opts.to} | Asunto: ${opts.subject}`,
      );
      this.logger.debug(`[NOTIF LOG] HTML:\n${opts.html}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`[NOTIF OK] Email enviado → ${opts.to}`);
    } catch (err) {
      this.logger.error(
        `[NOTIF ERROR] Fallo envío a ${opts.to}: ${(err as Error).message}`,
      );
    }
  }

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

    await this.sendEmail({
      to: data.patientEmail,
      subject: `Consentimiento pendiente — Orden #${data.orderId}`,
      html,
    });
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

    await this.sendEmail({ to: data.doctorEmail, subject, html });
  }

  async notifyResultReady(data: ResultReadyData): Promise<void> {
    const html = (recipientName: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <h2 style="color: #16a34a; margin-top: 0;">Resultados Disponibles</h2>
  <p>Estimado/a <strong>${recipientName}</strong>,</p>
  <p>Los resultados de la orden de laboratorio <strong>#${data.orderId}</strong> ya están disponibles.</p>
  <p>Paciente: <strong>${data.patientName}</strong></p>
  <p>Médico tratante: <strong>${data.doctorName}</strong></p>
  <p>Puede consultar los resultados ingresando al sistema.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb;" />
  <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">Mensaje automático — Sistema APP-DX. No responder a este correo.</p>
</div>`.trim();

    const sends: Promise<void>[] = [];

    if (data.doctorEmail) {
      sends.push(
        this.sendEmail({
          to: data.doctorEmail,
          subject: `Resultados disponibles — Orden #${data.orderId}`,
          html: html(data.doctorName),
        }),
      );
    } else {
      this.logger.warn(
        `[NOTIF] Sin email de médico para orden ${data.orderId} — omitiendo notificación de resultado`,
      );
    }

    if (data.patientEmail) {
      sends.push(
        this.sendEmail({
          to: data.patientEmail,
          subject: `Sus resultados están listos — Orden #${data.orderId}`,
          html: html(data.patientName),
        }),
      );
    }

    await Promise.all(sends);
  }
}
