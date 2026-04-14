# Entidades de Dominio — UDT-03: Patients

## Entidad: Patient

```
Patient
├── id             : String (UUID v4, PK)
├── documentType   : DocumentType (DNI | PASAPORTE | CE | NIT)
├── documentNumber : String (NOT NULL, parte del índice único compuesto)
├── firstName      : String
├── lastName       : String
├── birthDate      : DateTime
├── phone          : String? (opcional)
├── email          : String? (opcional, email del paciente)
├── deletedAt      : DateTime? (soft delete)
├── createdAt      : DateTime (auto, default=now())
├── updatedAt      : DateTime (auto, @updatedAt)
├── createdBy      : String? (userId del operador que registró)
├── updatedBy      : String? (userId del operador que actualizó)
├── orders         : Order[] (relación 1:N)
└── appointments   : Appointment[] (relación 1:N)

UNIQUE: (documentType, documentNumber)
```

### Proyección de respuesta (PatientResponseDto)
```
{
  id             : string
  documentType   : string
  documentNumber : string
  firstName      : string
  lastName       : string
  birthDate      : string (ISO date)
  phone          : string | null
  email          : string | null
  createdAt      : string (ISO)
  updatedAt      : string (ISO)
  createdBy      : string | null
  updatedBy      : string | null
}
```

## Enumeración: DocumentType
```
DNI        → Documento Nacional de Identidad
PASAPORTE  → Pasaporte internacional
CE         → Carnet de Extranjería
NIT        → Número de Identificación Tributaria
```

> **Nota**: El enum `DocumentType` se agrega al `prisma/schema.prisma` en esta unidad.
