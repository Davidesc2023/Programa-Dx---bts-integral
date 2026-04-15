# v13 — Clarification Questions (AI-DLC INCEPTION)

**Fase**: Requirements Analysis  
**Fecha**: 2026-04-15  
**Proyecto**: APP-DX — Rediseño Módulo de Consentimiento (PDF + S3 + Doble Firma Legal)

---

## Contexto técnico

El Dockerfile actual usa `node:20-alpine`. Chromium/Puppeteer en Alpine requiere configuración adicional.  
Se necesita elegir: (a) librería de PDF y (b) proveedor de S3-compatible.

---

## Pregunta 1: Librería PDF (Puppeteer en Docker Alpine)

¿Cómo generamos el PDF desde HTML?

```
A) puppeteer-core + @sparticuz/chromium — Chromium preempaquetado, 
   funciona en Alpine/Railway sin cambios al Dockerfile. Recomendado.

B) node:20-slim + puppeteer full — Cambiar Dockerfile de Alpine a Debian Slim; 
   más fácil de configurar Puppeteer pero imagen más grande (~200MB extra).

C) html-pdf-node — Wrapper ligero sobre puppeteer; misma configuración 
   que A pero con API más simple. Funciona en Alpine con @sparticuz/chromium.

D) pdfmake — Generación programática de PDF (sin HTML→PDF). 
   No requiere Chromium. Más limitado en diseño pero cero dependencies pesadas.

E) Otro
```

[A]: 

---

## Pregunta 2: Proveedor de almacenamiento S3

¿Dónde almacenamos los PDFs firmados?

```
A) AWS S3 — Estándar, @aws-sdk/client-s3. Requiere cuenta AWS + bucket + 
   ACCESS_KEY_ID + SECRET_ACCESS_KEY + REGION + BUCKET_NAME.

B) Cloudflare R2 — 100% compatible con SDK de AWS S3 (mismo código). 
   Free tier 10GB storage + 1M operaciones/mes. Sin egress fees.
   Requiere CLOUDFLARE_ACCOUNT_ID + R2 API token.

C) Supabase Storage — Compatible S3, free tier 1GB. 
   Requiere SUPABASE_URL + SUPABASE_SERVICE_KEY.

D) MinIO (self-hosted en Railway) — Deploy de MinIO como segundo servicio en Railway. 
   100% gratis pero requiere gestión.

E) Otro (describe en el campo de respuesta)
```

[B]: 

---

## Pregunta 3: Firma del médico en el frontend

¿Cómo firma el médico el consentimiento en la UI?

```
A) Botón "Firmar consentimiento" con confirmación modal — 
   El médico lee el documento HTML y hace click en "Confirmo que soy el médico 
   tratante y firmo este consentimiento". Sin campo de texto adicional.

B) Campo de texto de firma — El médico escribe su nombre completo como firma 
   (tipo "Escriba su nombre para firmar") + botón confirmar.

C) Checkbox legal + botón — "Confirmo que he leído y acepto firmar este 
   consentimiento en nombre del paciente [Nombre]" (checkbox) + botón "Firmar".

D) Cualquiera de las anteriores — decides tú el approach más UX-friendly.
```

[A]: 

---

## Pregunta 4: Visualización del documento HTML

¿Dónde se muestra el contenido del consentimiento (documentHtml) al médico y al paciente?

```
A) Modal/overlay en el detalle de la orden — Al hacer click en "Ver consentimiento" 
   se abre un modal con el HTML renderizado.

B) Página dedicada /orders/[id]/consent — el HTML se muestra en la página de 
   consentimiento ya existente, arriba de los botones de firma.

C) Solo en PDF — No mostrar el HTML en la UI; el documento solo existe como PDF.

D) B + PDF preview — Mostrar HTML en la página + botón "Descargar PDF" cuando existe URL.
```

[D]: 

