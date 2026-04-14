# Entidades de Dominio — UDT-02: Users + Auth

## Entidad: User

```
User
├── id             : String (UUID v4, PK)
├── email          : String (UNIQUE, NOT NULL)
├── password       : String (hash bcrypt, NO exponer en respuestas)
├── role           : UserRole (ADMIN | OPERADOR | LABORATORIO, default=OPERADOR)
├── deletedAt      : DateTime? (soft delete)
├── createdAt      : DateTime (auto, default=now())
├── updatedAt      : DateTime (auto, @updatedAt)
├── createdBy      : String? (userId del ADMIN que creó)
├── updatedBy      : String? (userId del ADMIN que actualizó)
└── refreshTokens  : RefreshToken[] (relación 1:N)
```

### Proyección de respuesta (UserResponseDto — campos expuestos)
```
{
  id        : string
  email     : string
  role      : 'ADMIN' | 'OPERADOR' | 'LABORATORIO'
  createdAt : string (ISO)
  updatedAt : string (ISO)
  createdBy : string | null
  updatedBy : string | null
}
```
> **NUNCA** incluir `password`, `deletedAt`, o `refreshTokens` en respuestas.

---

## Entidad: RefreshToken

```
RefreshToken
├── id            : String (UUID v4, PK)
├── token         : String (JWT firmado, UNIQUE, NOT NULL)
├── userId        : String (FK → User.id)
├── user          : User (relación N:1)
├── expiresAt     : DateTime (createdAt + 7 días)
├── invalidatedAt : DateTime? (null = válido, !null = invalidado por logout)
└── createdAt     : DateTime (auto, default=now())
```

---

## Enumeraciones

### UserRole
```
ADMIN        → Gestión completa del sistema (usuarios, pacientes, órdenes)
OPERADOR     → Creación de pacientes y órdenes
LABORATORIO  → Gestión de muestras y resultados
```

### OrderStatus (definida aquí para el schema completo, usada en UDT-04)
```
PENDIENTE           → Orden creada, esperando recolección de muestra
MUESTRA_RECOLECTADA → Muestra tomada, pendiente análisis
EN_ANALISIS         → Muestra en proceso de análisis
COMPLETADA          → Resultados disponibles
CANCELADA           → Orden cancelada por operador/admin
RECHAZADA           → Muestra rechazada por laboratorio
```
