# 🚀 Plan de Desarrollo — Sistema de Solicitud de Laboratorios

## 🎯 Objetivo
Construir una plataforma para gestionar:
- Pacientes
- Órdenes de laboratorio
- Agendamiento
- Resultados

---

## 🧩 FASE 1 — FOUNDATION (COMPLETADA ✅)

### Infraestructura
- [x] PostgreSQL
- [x] Prisma ORM
- [x] Migraciones

### Backend Base
- [x] NestJS configurado
- [x] Módulos (patients, orders, etc.)
- [x] PrismaModule

### Funcionalidad
- [x] Crear pacientes
- [x] Crear órdenes
- [x] Relación Order → Patient

### Calidad
- [x] DTOs (orders, patients)
- [x] ValidationPipe global

---

## 🔵 FASE 2 — APPLICATION LAYER (EN CURSO)

- [ ] Response DTOs (salida limpia)
- [ ] Manejo de errores centralizado
- [ ] Servicios con lógica de negocio clara
- [ ] Estructura tipo clean architecture

---

## 🟣 FASE 3 — AUTH & SECURITY

- [ ] Registro de usuarios
- [ ] Login (JWT)
- [ ] Roles (admin, operador, laboratorio)
- [ ] Guards en endpoints

---

## 🟢 FASE 4 — FEATURES

### Scheduling
- [ ] Crear citas
- [ ] Validar disponibilidad

### Results
- [ ] Registrar resultados
- [ ] Consultar resultados por paciente

---

## ⚫ FASE 5 — PRODUCCIÓN

- [ ] Logs estructurados
- [ ] Testing (unit + e2e)
- [ ] Docker
- [ ] Deploy

---

## 📌 Estado actual
👉 Backend base funcional con validación y persistencia