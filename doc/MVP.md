# 🚀 MVP — Sistema de Laboratorios

## 🎯 Objetivo MVP

Permitir registrar pacientes y crear órdenes de laboratorio
de forma estructurada y validada.

---

## ✅ Funcionalidades incluidas

### Pacientes
- [x] Crear paciente
- [x] Listar pacientes

### Órdenes
- [x] Crear orden
- [x] Asociar a paciente

---

## ❌ No incluido (por ahora)

- Autenticación
- Roles
- UI (frontend)
- Resultados
- Agendamiento

---

## 🧪 Endpoints disponibles

### POST /patients
Crear paciente

```json
{
  "name": "Juan Perez",
  "phone": "3001234567"
}