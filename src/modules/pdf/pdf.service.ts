import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// ────────────────────────────────────────────────────────────────────────────
// Data contract for the consent HTML template
// ────────────────────────────────────────────────────────────────────────────
export interface ConsentTemplateData {
  orderId: string;
  orderCreatedAt: Date;
  patientName: string;
  patientDocumentType: string;
  patientDocumentNumber: string;
  doctorName: string;
  doctorSpecialty: string | null;
  doctorMedicalLicense: string | null;
  doctorSignedAt: Date;
  patientSignedAt: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// HTML template — Consentimiento Informado (Ley 1581/2012 Colombia)
// ────────────────────────────────────────────────────────────────────────────
export function buildConsentHtml(data: ConsentTemplateData): string {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    }).format(d);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      color: #111;
      padding: 40px 50px;
      line-height: 1.6;
    }
    h1 { font-size: 15pt; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #555; font-size: 10pt; margin-bottom: 28px; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 11pt; font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: .04em; }
    .row { display: flex; gap: 8px; margin-bottom: 6px; }
    .label { font-weight: 600; min-width: 190px; color: #444; }
    .value { color: #111; }
    .legal { font-size: 9.5pt; color: #333; text-align: justify; line-height: 1.55; }
    .legal p { margin-bottom: 8px; }
    .signatures { display: flex; gap: 40px; margin-top: 30px; }
    .sig-box { flex: 1; border-top: 1px solid #111; padding-top: 10px; font-size: 10pt; }
    .sig-box .name { font-weight: 600; margin-bottom: 2px; }
    .sig-box .role { color: #555; font-size: 9pt; }
    .footer { margin-top: 30px; font-size: 8pt; color: #888; text-align: center; }
    .ref-id { font-family: monospace; font-size: 9pt; color: #666; }
  </style>
</head>
<body>
  <h1>Consentimiento Informado para Exámenes de Laboratorio</h1>
  <p class="subtitle">Documento legal — Ley 1581 de 2012 (Colombia)</p>

  <div class="section">
    <h2>Datos de la Orden</h2>
    <div class="row"><span class="label">Número de orden:</span><span class="value ref-id">${data.orderId}</span></div>
    <div class="row"><span class="label">Fecha de creación:</span><span class="value">${fmt(data.orderCreatedAt)}</span></div>
  </div>

  <div class="section">
    <h2>Datos del Paciente</h2>
    <div class="row"><span class="label">Nombre completo:</span><span class="value">${data.patientName}</span></div>
    <div class="row"><span class="label">Tipo de documento:</span><span class="value">${data.patientDocumentType}</span></div>
    <div class="row"><span class="label">Número de documento:</span><span class="value">${data.patientDocumentNumber}</span></div>
  </div>

  <div class="section">
    <h2>Médico Tratante</h2>
    <div class="row"><span class="label">Nombre completo:</span><span class="value">${data.doctorName}</span></div>
    ${data.doctorSpecialty ? `<div class="row"><span class="label">Especialidad:</span><span class="value">${data.doctorSpecialty}</span></div>` : ''}
    ${data.doctorMedicalLicense ? `<div class="row"><span class="label">Registro médico:</span><span class="value">${data.doctorMedicalLicense}</span></div>` : ''}
    <div class="row"><span class="label">Fecha de firma médica:</span><span class="value">${fmt(data.doctorSignedAt)}</span></div>
  </div>

  <div class="section">
    <h2>Declaración de Consentimiento</h2>
    <div class="legal">
      <p>Yo, <strong>${data.patientName}</strong>, identificado(a) con ${data.patientDocumentType} N.° ${data.patientDocumentNumber}, declaro de manera libre, voluntaria y consciente que el médico tratante, <strong>${data.doctorName}</strong>, me ha informado de manera clara y comprensible sobre:</p>
      <p>a) La naturaleza de los exámenes de laboratorio clínico a realizar, sus propósitos diagnósticos y el procedimiento de toma de muestras biológicas.</p>
      <p>b) Los posibles riesgos, molestias o incomodidades asociadas al procedimiento de recolección de muestras, incluyendo pero no limitadas a: punción venosa, molestias transitorias, hematomas o mareos.</p>
      <p>c) Los beneficios esperados de los exámenes en relación con mi diagnóstico y tratamiento médico.</p>
      <p>d) Alternativas diagnósticas disponibles y las razones por las que se recomienda los presentes exámenes.</p>
      <p>e) El manejo confidencial de mis datos personales y resultados de salud, conforme a la <strong>Ley 1581 de 2012</strong> (Protección de Datos Personales) y la <strong>Resolución 1995 de 1999</strong> (Historia Clínica).</p>
      <p>En pleno uso de mis facultades mentales, y habiendo tenido la oportunidad de formular preguntas que fueron respondidas satisfactoriamente, <strong>OTORGO MI CONSENTIMIENTO</strong> para la realización de los exámenes de laboratorio indicados en la presente orden.</p>
      <p>Entiendo que puedo revocar este consentimiento en cualquier momento antes del inicio del procedimiento, sin que ello ocasione consecuencias negativas en mi atención médica.</p>
    </div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="name">${data.doctorName}</div>
      ${data.doctorSpecialty ? `<div class="role">${data.doctorSpecialty}</div>` : ''}
      ${data.doctorMedicalLicense ? `<div class="role">RM: ${data.doctorMedicalLicense}</div>` : ''}
      <div class="role">Firmado digitalmente: ${fmt(data.doctorSignedAt)}</div>
    </div>
    <div class="sig-box">
      <div class="name">${data.patientName}</div>
      <div class="role">${data.patientDocumentType} N.° ${data.patientDocumentNumber}</div>
      <div class="role">Acepta: ${fmt(data.patientSignedAt)}</div>
    </div>
  </div>

  <div class="footer">
    Documento generado automáticamente · Orden ${data.orderId} · Este documento tiene validez legal conforme a la Ley 527 de 1999 (Comercio Electrónico — Colombia)
  </div>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// PdfService — headless Chrome via @sparticuz/chromium (Alpine-compatible)
// ────────────────────────────────────────────────────────────────────────────
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateConsentPdf(html: string): Promise<Buffer> {
    this.logger.log('Launching headless Chromium for PDF generation…');

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless as boolean,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      });
      this.logger.log('PDF generated successfully');
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
