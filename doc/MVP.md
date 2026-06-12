# MVP v2.0 — APP-DX
## Plataforma Multi-Tenant de Programas Diagnósticos

**Versión:** 2.0  
**Última actualización:** 2026-06-12  
**Estado:** En planificación — Rediseño arquitectural

---

## Objetivo del MVP

Reemplazar los 6 formularios de MoreApp y los Excel manuales con una plataforma digital que cubra el flujo completo de un caso diagnóstico, sin requerir cuentas de usuario para médicos ni pacientes.

**Criterio de éxito del MVP:** Un caso real de Wilson, DAAT o Duchenne puede gestionarse de inicio a fin dentro de la plataforma, sin tocar Excel.

---

## Alcance del MVP v2.0

### ✅ Incluido en MVP

#### Multi-tenant base
- [ ] Schema de base de datos multi-tenant con RLS
- [ ] Tenant inicial: BTS Integral configurado
- [ ] Aislamiento de datos por tenant validado

#### Formularios públicos del médico (3 programas)
- [ ] `/solicitud/bts/wilson` — formulario Wilson (datos médico + paciente + tipo de prueba)
- [ ] `/solicitud/bts/alfa1` — formulario DAAT (datos médico + paciente + tipo de prueba)
- [ ] `/solicitud/bts/duchenne` — formulario Duchenne multi-país (CO, EC, PA, CR, GT)
- [ ] Selector de país → carga automáticamente el consentimiento del médico correcto
- [ ] Adjuntar resultado sérico previo (valor numérico + PDF) cuando el médico ya lo tiene
- [ ] Validación completa de campos con mensajes en español
- [ ] Rate limiting en formularios públicos
- [ ] Registro de IP + user-agent + timestamp en envío

#### Link privado del paciente
- [ ] Generación de token seguro (64 chars, SHA-256 en DB)
- [ ] Vista simplificada mobile-first para el paciente
- [ ] Consentimiento del paciente por país (mismo país que seleccionó el médico)
- [ ] Soporte de representante legal (si el médico lo marcó)
- [ ] Campo para reportar error en datos
- [ ] Botones AUTORIZO / NO AUTORIZO con campo de nombre completo
- [ ] Expiración a 72h, un solo uso
- [ ] Registro de respuesta con IP + user-agent + timestamp

#### Panel admin
- [ ] Login seguro (JWT httpOnly cookies)
- [ ] Dashboard: resumen de casos por estado y programa
- [ ] Lista de casos con filtros (programa, estado, país, fecha)
- [ ] Detalle de caso: todos los datos del médico y paciente
- [ ] Acciones por caso:
  - Generar link del paciente (copy al portapapeles)
  - Reenviar link (invalida el anterior)
  - Cambiar estado manualmente
  - Registrar laboratorio, sede, fecha de programación
  - Registrar resultado sérico (valor + unidad + fecha)
  - Marcar indicación genética (con/sin)
  - Registrar resultado genético y fenotipo
  - Registrar seguimiento (Wilson)
  - Agregar observaciones
- [ ] Notificación al admin cuando llega una nueva solicitud del médico
- [ ] Notificación al admin cuando el paciente responde

#### Consentimientos
- [ ] CRUD de plantillas por programa + país + tipo (MEDICO | PACIENTE)
- [ ] Versionado (nueva versión archiva la anterior sin borrarla)
- [ ] Vista previa del consentimiento renderizado
- [ ] Plantillas iniciales cargadas: Wilson CO, DAAT CO, Duchenne (CO/EC/PA/CR/GT)

#### Importación de datos históricos
- [ ] Importar Excel Wilson (hoja `orden` + hoja `autorizacion`)
- [ ] Importar Excel DAAT (hojas `GENERAL` y `WILSON` de la base consolidada)
- [ ] Validación previa con reporte de errores descargable
- [ ] Normalización automática de estados
- [ ] Manejo de caracteres especiales (encoding)
- [ ] Importación de casos con iniciales únicamente (marcados como `DATOS_INCOMPLETOS`)

#### Tests y calidad
- [ ] Tests unitarios frontend (Jest + RTL): cobertura ≥ 80% en módulos críticos
- [ ] Tests backend (Deno test): state machine, magic links, validaciones
- [ ] CI/CD: lint + type-check + tests en cada PR y merge a main
- [ ] 0 vulnerabilidades críticas (npm audit + deno audit)

---

### ❌ Fuera del MVP (Post-MVP)

| Feature | Razón de exclusión |
|---------|-------------------|
| Link de resultados para médico/paciente | Segunda iteración, requiere gestión de archivos |
| Notificaciones por WhatsApp/email automáticas | Requiere integración con Twilio/SendGrid |
| OTP por SMS para paciente | Añade validez legal, pero no es bloqueante para MVP |
| Segundo tenant (otra farmacéutica) | BTS valida el modelo primero |
| Branding personalizado por tenant | El diseño es estático en MVP |
| Reportes avanzados | Filtros básicos suficientes para MVP |
| Importación de Duchenne (Excel vacío) | Casos nuevos entran por el form |
| Seguimiento automatizado de Wilson | El admin lo registra manualmente |
| Plantillas Duchenne para todos los países | Solo Colombia en MVP, otros se agregan al confirmar demanda |

---

## Criterios de aceptación del MVP

### Formulario del médico
- Un médico puede abrir el link, llenar el formulario completamente en menos de 5 minutos
- El formulario es usable en smartphone (Android/iOS, Chrome/Safari)
- Si hay un campo obligatorio vacío, el formulario no se envía y señala el campo
- El consentimiento del médico cambia automáticamente al seleccionar el país (Duchenne)
- Al enviar, el admin recibe una notificación con los datos del caso

### Link del paciente
- El admin puede generar el link y copiarlo al portapapeles en 2 clics
- Un paciente mayor de 60 años puede entender y completar el formulario sin ayuda técnica
- El link expira a las 72h y no puede usarse una segunda vez
- La respuesta (autoriza / no autoriza) queda registrada en la plataforma en menos de 1 segundo

### Panel admin
- Un operador puede ver todos los casos de su tenant filtrados por estado en menos de 3 segundos
- Un operador puede registrar el resultado sérico de un caso en menos de 2 minutos
- El admin puede cambiar el estado de un caso manualmente en cualquier momento

### Importación
- El admin puede importar el Excel histórico de Wilson (117 filas) sin errores bloqueantes en los casos válidos
- El admin puede importar el Excel de DAAT (789 filas) con normalización automática de estados
- Los casos importados con iniciales únicamente se marcan como `DATOS_INCOMPLETOS` y aparecen en la lista de casos

### Calidad
- La suite de tests corre en menos de 2 minutos en CI
- Ningún merge a `main` sin pasar lint + type-check + tests

---

## Definición de "Hecho" (DoD) por tarea

Una tarea se considera completa cuando:
1. El código está en `main`
2. Los tests unitarios correspondientes están escritos y pasan
3. El type-check pasa sin errores
4. El lint pasa sin warnings
5. El comportamiento fue verificado manualmente en el ambiente de preview de Vercel
6. La historia de usuario correspondiente en USER-STORIES.md tiene los criterios de aceptación marcados como verificados
