# Increment v4 — Clarification Questions
## Módulo: Adjuntos en Resultados (§6.5 PRD)

**Fase**: INCEPTION — Requirements Analysis  
**Fecha**: 2026-04-14  
**Scope PRD**: §6.5 Resultados — adjuntar archivos (PDF, imágenes) a un resultado de laboratorio

---

## Question 1
¿Dónde deben almacenarse los archivos subidos?

A) **Disco local del contenedor** — carpeta `/uploads` mapeada como volumen Docker; simple, sin dependencias externas; no apto para multi-instancia  
B) **MinIO** (S3-compatible, self-hosted) — objeto storage propio; requiere agregar contenedor MinIO al docker-compose  
C) **AWS S3 / compatible cloud** — almacenamiento en la nube; requiere credenciales AWS y SDK  
D) **Base de datos (bytea/base64)** — archivo como campo binario en PostgreSQL; simple pero poco escalable  
X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 2
¿Qué tipos de archivo deben permitirse?

A) **Solo PDF** — documentos de laboratorio  
B) **PDF + imágenes** (JPG, PNG, WEBP) — para reportes e imágenes diagnósticas  
C) **PDF + imágenes + DICOM** — incluye imágenes médicas estándar (.dcm)  
D) **Cualquier tipo** — sin restricción de formato  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 3
¿Cuál es el tamaño máximo permitido por archivo?

A) **5 MB** — para PDFs livianos  
B) **10 MB** — balance entre PDFs y imágenes de calidad media  
C) **25 MB** — para imágenes de alta resolución  
D) **Sin límite** definido por ahora  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 4
¿Cómo se estructura la API de adjuntos?

A) **Nested bajo resultado**: `POST /results/:resultId/attachments` / `GET /results/:resultId/attachments` / `DELETE /results/:resultId/attachments/:attachmentId`  
B) **Módulo independiente**: `POST /attachments` (con `resultId` en el body) / `GET /attachments?resultId=...` / `DELETE /attachments/:id`  
C) **Endpoint en el propio resultado**: ampliar el endpoint `PATCH /results/:id` para aceptar multipart con archivo incluido  
X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 5
¿Cómo debe servirse un archivo para descarga?

A) **Endpoint de descarga directo**: `GET /results/:resultId/attachments/:attachmentId/download` — el API lee el archivo y lo retorna como stream  
B) **URL pública estática**: retornar la URL del archivo (ej. `http://api/uploads/archivo.pdf`) servida como static assets por NestJS  
C) **Solo metadata**: el API solo devuelve el `filePath` o `fileKey`; el cliente accede al storage directamente  
X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 6
¿Cuántos archivos puede tener un resultado?

A) **1 archivo por resultado** — un único adjunto (reemplaza si ya existe)  
B) **Múltiples archivos por resultado** — N adjuntos (nuevo modelo `ResultAttachment` con relación 1:N)  
C) **Hasta 5 archivos por resultado** — límite razonable para el contexto clínico  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 7
¿Qué roles pueden subir archivos adjuntos a un resultado?

A) **Solo LABORATORIO y ADMIN** — quienes ejecutan los exámenes  
B) **LABORATORIO + MEDICO + ADMIN** — el médico también puede adjuntar documentos  
C) **Todos los roles autenticados** (ADMIN, OPERADOR, LABORATORIO, MEDICO)  
X) Other (please describe after [Answer]: tag below)

[B]: 
