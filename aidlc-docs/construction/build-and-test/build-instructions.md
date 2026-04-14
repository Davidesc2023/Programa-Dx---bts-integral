# Build Instructions — APP-DX (Increment v7: Frontend & UX)

## Prerequisites

- Docker Desktop running
- Backend containers running (`docker compose up -d`)
- Node.js available via Docker (node:20-alpine image)

---

## 1. Backend Build (NestJS)

```bash
# Desde el root del workspace
docker compose build api
docker compose up -d
```

Verificar:
```bash
docker compose ps
# lab_api debe estar Up en puerto 3000
curl http://localhost:3000/health
```

---

## 2. Frontend Build (Next.js — Produccion)

```bash
$frontendPath = "c:\Users\DavidEstebanSanguino\OneDrive - BotoShop\Business Intelligence\APP-DX\frontend"
docker run --rm -v "${frontendPath}:/app" -w /app node:20-alpine sh -c "npm install --legacy-peer-deps && npm run build"
```

**Resultado esperado**:
```
Route (app)                              Size     First Load JS
+- / (Static)                           137 B          87.1 kB
+- /appointments                        5.68 kB        150 kB
+- /consents                            4.96 kB        136 kB
+- /dashboard                           6.6 kB         137 kB
+- /login                               3.5 kB         141 kB
+- /orders                              3.44 kB        150 kB
+- /orders/[id]                         8.15 kB        153 kB
+- /orders/new                          3.23 kB        164 kB
+- /patients                            2.87 kB        149 kB
+- /patients/[id]/edit                  3.54 kB        164 kB
+- /patients/new                        3.02 kB        164 kB
+- /results                             5.81 kB        150 kB
+- /results/[id]                        9.18 kB        150 kB
+- /results/[id]/edit                   2.94 kB        170 kB
+- /results/new                         2.56 kB        170 kB

Generating static pages (15/15) DONE
```

---

## 3. Frontend Dev Server (Desarrollo)

```bash
# Requiere node en PATH, o usar Docker con puerto expuesto
docker run --rm -p 3001:3001 -v "${frontendPath}:/app" -w /app node:20-alpine sh -c "npm install --legacy-peer-deps && npm run dev -- -p 3001 -H 0.0.0.0"
```

Acceso: `http://localhost:3001`

---

## 4. Configuracion de Variables de Entorno

Crear `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

El archivo `frontend/src/services/api.ts` usa `NEXT_PUBLIC_API_URL` si esta definido, o `http://localhost:3000` por defecto.

---

## Verificado

- **Fecha**: 2026-04-14
- **Build status**: PASS — 15 rutas, 0 errores TypeScript
- **Next.js**: 14.2.2
- **Node**: 20-alpine
