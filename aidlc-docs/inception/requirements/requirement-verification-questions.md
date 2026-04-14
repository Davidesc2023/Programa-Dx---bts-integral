# Requirement Verification Questions
## Sistema de Solicitud de Laboratorios (APP-DX)

**Instructions**: Please answer each question by filling in the letter choice after the `[Answer]:` tag.
If you choose "X) Other", describe your answer on the same line after the tag.

---

## Question 1 — Project Scope for this AI-DLC Session
The `doc/PLAN.md` defines 5 phases. Which phases should AI-DLC build in this session?

A) All 5 phases end-to-end (Foundation → Application Layer → Auth → Features → Production)
B) Phase 2 onwards (Application Layer, Auth, Features, Production) — Phase 1 Foundation already complete
C) Only Phase 2 + Phase 3 (Application Layer + Auth & Security)
D) Full product including all phases from scratch (ignore progress in PLAN.md)
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 2 — Patient Data Model Fields
The PRD and MVP reference `name` and `phone` for a patient. What is the complete set of required fields?

A) Basic: name, phone only (as in MVP)
B) Standard: name, document type (CC/TI/CE/Passport), document number, birth date, phone, email
C) Extended: name, document type, document number, birth date, phone, email, address, gender
D) Healthcare-grade: name, full document info, birth date, contact info, emergency contact, EPS/insurance
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 3 — Order Data Model
What information must a lab order contain?

A) Minimal: patient reference, creation date only
B) Standard: patient reference, order date, list of requested tests/services, status (pending/in-progress/completed), notes
C) Extended: all of B + ordering physician, priority (urgent/routine), observations, estimated completion date
D) Full: all of C + insurance coverage info, sample collection details
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 4 — Order Status Workflow
What are the valid statuses for a lab order and how does it transition?

A) Simple: PENDING → COMPLETED
B) Standard: PENDING → IN_PROGRESS → COMPLETED (with optional CANCELLED)
C) Clinical: PENDING → SAMPLE_COLLECTED → IN_ANALYSIS → COMPLETED (with CANCELLED, REJECTED)
D) Custom (describe transitions after [Answer]:)
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 5 — Authentication & JWT
Phase 3 plans JWT authentication. What are the token requirements?

A) Basic JWT: access token only, no expiry concern, simple secret in .env
B) Standard JWT: access token (15min expiry) + refresh token (7 days), secret from env variables
C) Secure JWT: access token (15min) + refresh token (7 days) + token rotation, secrets from secrets manager
D) No authentication needed for current scope (skip Phase 3 for now)
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 6 — Role Permissions Matrix
The PRD defines Admin, Operador (Operator), and Laboratorio (Lab) roles. What permissions should each have?

A) Simple: all authenticated users can do everything (no granular role enforcement)
B) Standard:
   - Admin: full CRUD on all resources + user management
   - Operator: create/read patients and orders
   - Lab: read orders + update results only
C) Strict: each endpoint explicitly bound to one or more roles via guards
D) Custom (describe role matrix after [Answer]:)
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 7 — API Response Format & Error Handling
What standard should be used for API responses and errors?

A) Minimal: raw NestJS defaults + basic HttpException
B) Standard: unified response envelope `{ data, message, statusCode }` + centralized exception filter
C) RFC 7807 Problem Details format for errors + envelope for success
D) Custom response format (describe after [Answer]:)
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 8 — Pagination & Filtering
Should list endpoints (patients, orders) support pagination and filtering?

A) No pagination needed — small dataset assumed
B) Basic offset pagination: `?page=1&limit=10`
C) Full: offset pagination + filtering by key fields (e.g., patient name, order status, date range)
D) Cursor-based pagination for scalability
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 9 — Soft Delete vs Hard Delete
When deleting a patient or order, what behavior is expected?

A) Hard delete: record removed from DB permanently
B) Soft delete: `deletedAt` timestamp field, records filtered from queries but kept in DB
C) No delete functionality needed (records are immutable once created)
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 10 — Audit Trail / Traceability
The PRD mentions "falta de trazabilidad" as a current problem. What level of audit is required?

A) None beyond DB timestamps (createdAt, updatedAt on entities)
B) Basic: `createdBy` / `updatedBy` user reference on each entity
C) Full audit log: separate `audit_log` table recording every create/update/delete with user, timestamp, before/after values
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 11 — Results Module Scope
When should the Results module be built?

A) Not in this session — future phase only
B) Include data model and basic CRUD endpoints now (no business logic)
C) Full implementation: register result per test in an order, attach files/attachments, query history
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 12 — Scheduling Module Scope
The PRD vision includes appointment scheduling. What should be built now?

A) Not in this session — future phase only
B) Basic: create appointment, link to patient + order, date/time
C) Full: availability validation, conflict detection, appointment management
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 13 — Architecture Style
Phase 2 of PLAN.md mentions "estructura tipo clean architecture". What level of layering is required?

A) Standard NestJS layering: Controller → Service → Repository (Prisma direct)
B) Clean Architecture: Controller → Use Case → Domain Entity → Repository interface + Prisma adapter
C) Hexagonal / Ports & Adapters with strict dependency inversion
D) Modular monolith: NestJS modules with service layer, no strict clean arch layers
X) Other (please describe after [Answer]: tag below)

[D]: 

---

## Question 14 — Testing Requirements
What testing coverage is required? (Phase 5 in PLAN mentions unit + e2e)

A) No automated tests for now
B) Unit tests only for services (Jest)
C) Unit tests (services) + integration tests (Prisma + DB)
D) Full: unit tests + e2e tests (supertest) + coverage report
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 15 — Deployment Target
Phase 5 mentions Docker and Deploy. What is the deployment target?

A) Local development only (no deployment concern for now)
B) Docker Compose (postgres + nestjs app)
C) Cloud (AWS/GCP/Azure) — specify provider after [Answer]:
D) Docker + CI/CD pipeline (GitHub Actions or similar)
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 16 — Security Extensions
Should OWASP/security baseline rules be enforced as hard constraints across all AI-DLC phases?
(This means verifying encryption, input validation, auth hardening, logging on every artifact)

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip security extension rules (suitable for PoCs or internal-only prototypes)
X) Other (please describe after [Answer]: tag below)

[A]: 
