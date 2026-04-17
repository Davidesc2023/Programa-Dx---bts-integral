# PRD: APP-DX — BTS Integral

## Contexto
Diseñar una aplicación web responsive (mobile-first + tablet + desktop) para un sistema de gestión de diagnósticos y laboratorios clínicos.

## Identidad Visual
- **Primario:** #1B7A6B (teal clínico)
- **Acento:** #F5C518 (amarillo)
- **Secundario:** #4490D9 (azul)
- **Fondo:** Blanco / Gris muy claro
- **Estilo:** Health-tech SaaS moderno, minimalista, profesional, bordes redondeados (8-16px).

## Flujos Críticos
1. **Registro Médico:** Formulario -> Estado PENDIENTE_APROBACION.
2. **Consentimiento Legal:** Scrollable, checkbox, firma digital, cumplimiento Ley 1581 (Colombia).
3. **Dashboard Médico:** Crear orden, mis órdenes, pacientes, resultados.
4. **Crear Orden:** Selección dinámica de exámenes, prioridad, notas.
5. **Consentimiento Paciente:** Recibe link, visualiza documento, acepta/rechaza.
6. **Agendamiento y Resultados:** Calendario, carga de archivos (PDF/Imagen) drag & drop.

## Reglas UX
- Timeline visual del estado.
- Feedback inmediato.
- Multitenancy (Logo dinámico).
- Idioma: Español.