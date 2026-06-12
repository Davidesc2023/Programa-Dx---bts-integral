import { http, HttpResponse } from 'msw'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export const handlers = [
  // Formulario público del médico — obtener datos del tenant+programa
  http.get(`${BASE_URL}/public/:tenant/:programa`, ({ params }) => {
    return HttpResponse.json({
      tenant: { slug: params.tenant, nombre: 'BTS Integral', color_primario: '#1B7A6B' },
      programa: { codigo: params.programa, nombre: 'Enfermedad de Wilson' },
      consentimiento_medico: {
        id: 'consent-medico-123',
        titulo: 'Consentimiento del Médico',
        cuerpo_html: '<p>Texto del consentimiento médico...</p>',
      },
    })
  }),

  // Crear caso (submit del médico)
  http.post(`${BASE_URL}/public/:tenant/:programa`, () => {
    return HttpResponse.json(
      { id: 'caso-123', consecutivo: 'WILSON-001', estado: 'SOLICITUD_RECIBIDA' },
      { status: 201 }
    )
  }),

  // Obtener datos del paciente por token
  http.get(`${BASE_URL}/autorizar/:token`, ({ params }) => {
    if (params.token === 'token-expirado') {
      return HttpResponse.json({ error: 'TOKEN_EXPIRADO' }, { status: 410 })
    }
    return HttpResponse.json({
      caso: {
        id: 'caso-123',
        medico_nombre: 'Dr. Juan Pérez',
        medico_especialidad: 'Hepatología',
        paciente_nombre: 'María García',
        paciente_ciudad: 'Bogotá',
        programa: { nombre: 'Enfermedad de Wilson' },
      },
      consentimiento: { titulo: 'Consentimiento del Paciente', cuerpo_html: '<p>Texto...</p>' },
    })
  }),

  // Respuesta del paciente
  http.post(`${BASE_URL}/autorizar/:token`, () => {
    return HttpResponse.json({ success: true, autorizacion: 'AUTORIZADO' })
  }),
]
