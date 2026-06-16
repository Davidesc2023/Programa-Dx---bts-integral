// Fase 12: Notificaciones automáticas por email
// Proveedor: Resend (https://resend.com) — compatible con Deno/Edge
// Requiere: variable de entorno RESEND_API_KEY
// Si no está configurada, las notificaciones se omiten silenciosamente.

const RESEND_URL = "https://api.resend.com/emails"
const FROM_ADDRESS = Deno.env.get("EMAIL_FROM") ?? "BTS Integral DX <noreply@btsi.co>"
const API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""

// ─── Low-level sender ─────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!API_KEY) return  // sin key → silencio

  try {
    await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
    })
  } catch {
    // No propagar errores de email — nunca deben bloquear la respuesta HTTP
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#1B7A6B;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">BTS Integral — DX</p>
            <p style="margin:4px 0 0;color:#a7d5cd;font-size:13px;">Programa de Diagnóstico Especializado</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f6f5;padding:16px 32px;border-top:1px solid #e0e8e5;">
            <p style="margin:0;color:#9eaaa7;font-size:11px;text-align:center;">
              Este mensaje es generado automáticamente por el sistema BTS Integral — DX.<br>
              Si tiene preguntas, comuníquese con el equipo de BTS Integral.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${color}20;color:${color};">${text}</span>`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6e7976;font-size:13px;width:160px;">${label}</td>
    <td style="padding:6px 0;color:#191c1d;font-size:13px;font-weight:500;">${value}</td>
  </tr>`
}

// ─── Template: caso creado ────────────────────────────────────────────────────

export async function notificarCasoCreado(opts: {
  medicoEmail: string
  medicoNombre: string
  consecutivo: string
  programa: string
  pais: string
  pacienteNombre: string
  pacienteIniciales: string
}): Promise<void> {
  const subject = `✅ Solicitud registrada — ${opts.consecutivo}`
  const html = layout(subject, `
    <h2 style="margin:0 0 8px;color:#191c1d;font-size:20px;">Solicitud registrada exitosamente</h2>
    <p style="margin:0 0 24px;color:#6e7976;font-size:14px;">
      Estimado/a Dr./Dra. ${opts.medicoNombre}, su solicitud ha sido recibida en el sistema.
      Nuestro equipo se pondrá en contacto con usted para coordinar los siguientes pasos.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow("Consecutivo", `<code style="font-family:monospace;color:#1B7A6B;font-size:14px;">${opts.consecutivo}</code>`)}
      ${infoRow("Programa", opts.programa)}
      ${infoRow("País", opts.pais)}
      ${infoRow("Paciente", opts.pacienteIniciales)}
      ${infoRow("Estado", badge("Solicitud recibida", "#6b7280"))}
    </table>

    <p style="margin:0;color:#6e7976;font-size:13px;">
      Puede consultar el estado de su solicitud comunicándose directamente con el equipo de BTS Integral.
    </p>
  `)

  await sendEmail(opts.medicoEmail, subject, html)
}

// ─── Template: resultado sérico disponible ────────────────────────────────────

export async function notificarResultadoSerico(opts: {
  medicoEmail: string
  medicoNombre: string
  consecutivo: string
  programa: string
  pacienteIniciales: string
  resultado: string
  interpretacion?: string | null
}): Promise<void> {
  const subject = `🔬 Resultado sérico disponible — ${opts.consecutivo}`
  const html = layout(subject, `
    <h2 style="margin:0 0 8px;color:#191c1d;font-size:20px;">Resultado sérico disponible</h2>
    <p style="margin:0 0 24px;color:#6e7976;font-size:14px;">
      El resultado sérico del caso <strong>${opts.consecutivo}</strong> ya está disponible en el sistema.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow("Consecutivo", `<code style="font-family:monospace;color:#1B7A6B;font-size:14px;">${opts.consecutivo}</code>`)}
      ${infoRow("Programa", opts.programa)}
      ${infoRow("Paciente", opts.pacienteIniciales)}
      ${infoRow("Resultado", opts.resultado)}
      ${opts.interpretacion ? infoRow("Interpretación", opts.interpretacion) : ""}
      ${infoRow("Estado", badge("Resultado sérico", "#0891b2"))}
    </table>

    <p style="margin:0;color:#6e7976;font-size:13px;">
      Nuestro equipo revisará el resultado y le informará si se requiere análisis genético.
      En caso de dudas, comuníquese con el equipo de BTS Integral.
    </p>
  `)

  await sendEmail(opts.medicoEmail, subject, html)
}

// ─── Template: caso completado ────────────────────────────────────────────────

export async function notificarCasoCompletado(opts: {
  medicoEmail: string
  medicoNombre: string
  consecutivo: string
  programa: string
  pacienteIniciales: string
  tieneIndicacionGenetica?: boolean | null
  estadoGenetico?: string | null
  seguimientoClinico?: string | null
}): Promise<void> {
  const subject = `✅ Caso completado — ${opts.consecutivo}`

  const resumenGenetica = opts.tieneIndicacionGenetica === true
    ? `<p style="margin:0 0 12px;padding:12px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:4px;color:#166534;font-size:13px;">
        <strong>Análisis genético:</strong> ${opts.estadoGenetico ?? "Completado"}
       </p>`
    : opts.tieneIndicacionGenetica === false
    ? `<p style="margin:0 0 12px;padding:12px;background:#f0f9ff;border-left:3px solid #0891b2;border-radius:4px;color:#075985;font-size:13px;">
        No se requirió análisis genético para este caso.
       </p>`
    : ""

  const resumenSeguimiento = opts.seguimientoClinico
    ? `<p style="margin:0 0 24px;color:#6e7976;font-size:13px;">
        <strong>Seguimiento clínico:</strong> ${opts.seguimientoClinico}
       </p>`
    : ""

  const html = layout(subject, `
    <h2 style="margin:0 0 8px;color:#191c1d;font-size:20px;">Caso completado</h2>
    <p style="margin:0 0 24px;color:#6e7976;font-size:14px;">
      El proceso diagnóstico del caso <strong>${opts.consecutivo}</strong> ha sido completado.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow("Consecutivo", `<code style="font-family:monospace;color:#1B7A6B;font-size:14px;">${opts.consecutivo}</code>`)}
      ${infoRow("Programa", opts.programa)}
      ${infoRow("Paciente", opts.pacienteIniciales)}
      ${infoRow("Estado", badge("Completado", "#1B7A6B"))}
    </table>

    ${resumenGenetica}
    ${resumenSeguimiento}

    <p style="margin:0;color:#6e7976;font-size:13px;">
      El informe final será entregado por el equipo de BTS Integral.
      Gracias por confiar en nuestro programa de diagnóstico.
    </p>
  `)

  await sendEmail(opts.medicoEmail, subject, html)
}

// ─── Template: paciente no autorizó ──────────────────────────────────────────

export async function notificarNoAutorizacion(opts: {
  medicoEmail: string
  medicoNombre: string
  consecutivo: string
  programa: string
  pacienteIniciales: string
}): Promise<void> {
  const subject = `⚠️ Paciente no autorizó — ${opts.consecutivo}`
  const html = layout(subject, `
    <h2 style="margin:0 0 8px;color:#191c1d;font-size:20px;">El paciente no autorizó el proceso</h2>
    <p style="margin:0 0 24px;color:#6e7976;font-size:14px;">
      Le informamos que el paciente del caso <strong>${opts.consecutivo}</strong> ha decidido no autorizar
      el proceso diagnóstico. El caso ha sido cerrado en el sistema.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow("Consecutivo", `<code style="font-family:monospace;color:#1B7A6B;font-size:14px;">${opts.consecutivo}</code>`)}
      ${infoRow("Programa", opts.programa)}
      ${infoRow("Paciente", opts.pacienteIniciales)}
      ${infoRow("Estado", badge("No autorizó", "#ba1a1a"))}
    </table>

    <p style="margin:0;color:#6e7976;font-size:13px;">
      Si tiene preguntas o desea retomar el proceso en el futuro, comuníquese con el equipo de BTS Integral.
    </p>
  `)

  await sendEmail(opts.medicoEmail, subject, html)
}

// ─── Template: indicación genética confirmada ─────────────────────────────────

export async function notificarIndicacionGenetica(opts: {
  medicoEmail: string
  medicoNombre: string
  consecutivo: string
  programa: string
  pacienteIniciales: string
  tieneIndicacion: boolean
  motivo?: string | null
}): Promise<void> {
  const tieneInd = opts.tieneIndicacion
  const subject = tieneInd
    ? `🧬 Indicación genética confirmada — ${opts.consecutivo}`
    : `ℹ️ Sin indicación genética — ${opts.consecutivo}`

  const html = layout(subject, `
    <h2 style="margin:0 0 8px;color:#191c1d;font-size:20px;">
      ${tieneInd ? "Indicación genética confirmada" : "Sin indicación genética"}
    </h2>
    <p style="margin:0 0 24px;color:#6e7976;font-size:14px;">
      ${tieneInd
        ? `El caso <strong>${opts.consecutivo}</strong> tiene indicación para análisis genético. Procederemos con la programación de la muestra genética.`
        : `El resultado sérico del caso <strong>${opts.consecutivo}</strong> no presenta indicación de análisis genético. El proceso diagnóstico avanzará a cierre.`
      }
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow("Consecutivo", `<code style="font-family:monospace;color:#1B7A6B;font-size:14px;">${opts.consecutivo}</code>`)}
      ${infoRow("Programa", opts.programa)}
      ${infoRow("Paciente", opts.pacienteIniciales)}
      ${opts.motivo ? infoRow("Observación", opts.motivo) : ""}
      ${infoRow("Estado", badge(tieneInd ? "Con indicación genética" : "Sin indicación genética", tieneInd ? "#65a30d" : "#0891b2"))}
    </table>

    <p style="margin:0;color:#6e7976;font-size:13px;">
      Nuestro equipo le informará sobre los próximos pasos. Comuníquese con BTS Integral si tiene preguntas.
    </p>
  `)

  await sendEmail(opts.medicoEmail, subject, html)
}
