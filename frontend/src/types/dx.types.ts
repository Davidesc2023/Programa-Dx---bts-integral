// DX v2.0 — tipos para el módulo de tamizaje genético

export interface PublicTenant {
  id: string;
  nombre: string;
  slug: string;
  logo_url?: string | null;
}

export interface PublicPrograma {
  id: string;
  nombre: string;
  codigo: 'WILSON' | 'DAAT' | 'DUCHENNE';
  descripcion?: string | null;
}

export interface Consentimiento {
  pais_codigo: string;
  titulo: string;
  contenido_html: string;
  version: string;
}

export interface PublicFormData {
  tenant: PublicTenant;
  programa: PublicPrograma;
  consentimientos: Consentimiento[];
}

export interface CrearCasoPayload {
  pais_codigo: string;
  medico_nombre: string;
  medico_especialidad: string;
  medico_numero_registro: string;
  medico_email: string;
  medico_tipo_registro?: string;
  medico_whatsapp?: string;
  medico_institucion?: string;
  medico_ciudad?: string;
  paciente_nombre: string;
  paciente_tipo_doc: string;
  paciente_num_doc: string;
  paciente_genero?: string;
  paciente_eps?: string;
  paciente_telefono?: string;
  paciente_email?: string;
  paciente_ciudad?: string;
  paciente_departamento?: string;
  paciente_pais?: string;
  paciente_direccion?: string;
  rep_nombre?: string;
  rep_documento?: string;
  rep_parentesco?: string;
  rep_telefono?: string;
  resultado_previo_valor_1?: string;
  resultado_previo_valor_2?: string;
  resultado_previo_interpretacion?: string;
  resultado_previo_notas?: string;
}

export interface CrearCasoResponse {
  id: string;
  consecutivo: string;
  estado: string;
  programa: string;
  paciente_nombre: string;
  medico_email: string;
  created_at: string;
}

// ─── Fase 6: Autorización del paciente ───────────────────────────────────────

export interface CasoAutorizacion {
  id: string;
  consecutivo: string;
  pais_codigo: string;
  medico_nombre: string;
  medico_especialidad?: string | null;
  medico_institucion?: string | null;
  medico_ciudad?: string | null;
  paciente_nombre: string;
  paciente_tipo_doc?: string | null;
  paciente_num_doc?: string | null;
  paciente_genero?: string | null;
  paciente_eps?: string | null;
  paciente_iniciales?: string | null;
  rep_nombre?: string | null;
  rep_doc?: string | null;
  rep_parentesco?: string | null;
  paciente_autorizacion?: string | null;
  estado: string;
  created_at: string;
}

// Note: patient consent uses cuerpo_html (vs contenido_html for doctor form)
export interface ConsentimientoPaciente {
  id: string;
  titulo: string;
  cuerpo_html: string;
  version: string;
  marco_legal?: string | null;
}

export interface AutorizacionData {
  caso: CasoAutorizacion;
  consentimiento: ConsentimientoPaciente | null;
  expira_at: string;
  token_tipo: string;
}

export interface AutorizacionRespuesta {
  caso_id: string;
  consecutivo: string;
  estado: string;
  respuesta: 'AUTORIZADO' | 'NO_AUTORIZADO';
  firmado_at: string;
}

// ─── Fase 7: Admin panel ──────────────────────────────────────────────────────

export interface DxEstadoCount       { estado: string; count: number }
export interface DxProgramaCount     { codigo: string; nombre: string; count: number }
export interface DxPaisCount         { pais_codigo: string; count: number }
export interface DxMesCount          { mes: string; count: number }
export interface DxDepartamentoCount { departamento: string; count: number }
export interface DxAnoCount          { ano: string; count: number }
export interface DxMesProgramaCount  { mes: string; programa: string; count: number }
export interface DxEstadoGeneticoCount { estado_genetico: string; count: number }
export interface DxSeguimientoCount  { seguimiento_clinico: string; count: number }
export interface DxHeatmapCell       { medico_email: string; medico_nombre: string; mes: string; count: number }

export interface DxAutorizacionStats {
  autorizado:    number;
  no_autorizado: number;
  pendiente:     number;
}

// Estadísticas por médico: pendientes, en proceso, resultados, conversión
export interface DxMedicoStats {
  medico_email:      string;
  medico_nombre:     string;
  total:             number;
  pendientes:        number;   // estados iniciales sin resultado aún
  en_proceso:        number;   // en alguna etapa activa
  sin_indicacion:    number;   // sérico sin umbral genético
  con_indicacion:    number;   // sérico con umbral → derivado a genética
  positivos:         number;   // seguimiento_clinico = POSITIVO
  negativos:         number;   // seguimiento_clinico = NEGATIVO
  no_acepto:         number;   // NO_ACEPTO o paciente_autorizacion = NO_AUTORIZADO
  completados:       number;
  tasa_conversion:   number;   // con_indicacion / (con_indicacion + sin_indicacion) * 100
  tasa_completado:   number;   // completados / total * 100
}

// Embudo progresivo: cada etapa es un subconjunto de la anterior
export interface DxConversionFunnel {
  total:               number;
  autorizados:         number;
  muestra_tomada:      number;
  con_resultado_serico: number;
  con_indicacion:      number;
  sin_indicacion:      number;
  genetica_realizada:  number;
  completados:         number;
  no_acepto:           number;
}

export interface DxFiltrosActivos {
  programa: string | null;
  pais:     string | null;
  ano:      string | null;
  medico:   string | null;
  estado:   string | null;
}

export interface DxMedicoLista {
  email:  string;
  nombre: string;
}

export interface DxDashboardData {
  por_estado:              DxEstadoCount[];
  por_programa:            DxProgramaCount[];
  por_pais:                DxPaisCount[];
  por_mes:                 DxMesCount[];
  pendientes_autorizacion: number;
  casos_recientes:         DxCasoItem[];
  por_departamento:        DxDepartamentoCount[];
  por_ano:                 DxAnoCount[];
  por_mes_programa:        DxMesProgramaCount[];
  estado_genetico_dist:    DxEstadoGeneticoCount[];
  seguimiento_dist:        DxSeguimientoCount[];
  tasa_autorizacion:       DxAutorizacionStats;
  por_medico:              DxMedicoStats[];
  heatmap_medico_mes:      DxHeatmapCell[];
  conversion_funnel:       DxConversionFunnel;
  medicos_lista:           DxMedicoLista[];
  filtros_activos:         DxFiltrosActivos;
}

export interface DxCasoItem {
  id: string;
  consecutivo: string;
  estado: string;
  pais_codigo: string;
  mes_solicitud: string;
  medico_nombre: string;
  medico_email: string;
  paciente_nombre: string;
  paciente_iniciales: string;
  created_at: string;
  updated_at?: string | null;
  programas: { nombre: string; codigo: string };
}

export interface DxAuditEntry {
  id: string;
  accion: string;
  actor_tipo: string;
  datos_json?: Record<string, unknown> | null;
  ip?: string | null;
  created_at: string;
}

export interface DxCasoDetalle {
  id: string;
  consecutivo: string;
  tenant_id: string;
  estado: string;
  pais_codigo: string;
  mes_solicitud: string;

  medico_nombre: string;
  medico_especialidad?: string | null;
  medico_tipo_registro?: string | null;
  medico_numero_registro: string;
  medico_email: string;
  medico_whatsapp?: string | null;
  medico_institucion?: string | null;
  medico_ciudad?: string | null;

  paciente_nombre: string;
  paciente_iniciales: string;
  paciente_tipo_doc?: string | null;
  paciente_num_doc?: string | null;
  paciente_genero?: string | null;
  paciente_eps?: string | null;
  paciente_telefono?: string | null;
  paciente_email?: string | null;
  paciente_ciudad?: string | null;
  paciente_departamento?: string | null;
  paciente_pais?: string | null;
  paciente_direccion?: string | null;

  rep_nombre?: string | null;
  rep_documento?: string | null;
  rep_parentesco?: string | null;
  rep_telefono?: string | null;

  resultado_previo_valor?: string | null;
  resultado_previo_interpretacion?: string | null;
  resultado_previo_pdf_url?: string | null;

  paciente_autorizacion?: string | null;
  paciente_autorizo_at?: string | null;
  paciente_nombre_firmado?: string | null;
  paciente_correccion_datos?: string | null;

  resultado_serico_1?: string | null;
  resultado_serico_2?: string | null;
  interpretacion_serico?: string | null;
  notas_serico?: string | null;
  serica_registrada_at?: string | null;

  tiene_indicacion_genetica?: boolean | null;
  indicacion_motivo?: string | null;
  indicacion_registrada_at?: string | null;

  estado_genetico?: string | null;
  resultado_genetico?: string | null;
  laboratorio_genetico?: string | null;
  fecha_genetica?: string | null;
  genetica_registrada_at?: string | null;

  seguimiento_clinico?: string | null;
  notas_seguimiento?: string | null;
  seguimiento_registrado_at?: string | null;

  created_at: string;
  updated_at?: string | null;

  programas: { id: string; nombre: string; codigo: string };
  audit_log: DxAuditEntry[];
}

// ─── Fase 8: Importación masiva ───────────────────────────────────────────────

export interface ImportRow {
  pais_codigo: string;
  medico_nombre: string;
  medico_especialidad: string;
  medico_numero_registro: string;
  medico_email: string;
  medico_tipo_registro?: string;
  medico_whatsapp?: string;
  medico_institucion?: string;
  medico_ciudad?: string;
  paciente_nombre: string;
  paciente_tipo_doc: string;
  paciente_num_doc: string;
  paciente_genero?: string;
  paciente_eps?: string;
  paciente_telefono?: string;
  paciente_email?: string;
  paciente_ciudad?: string;
  paciente_departamento?: string;
  paciente_pais?: string;
  paciente_direccion?: string;
  rep_nombre?: string;
  rep_documento?: string;
  rep_parentesco?: string;
  rep_telefono?: string;
  resultado_previo_valor?: string;
  resultado_previo_interpretacion?: string;
}

export interface ImportError {
  fila: number;
  mensaje: string;
}

export interface ImportCasoCreado {
  id: string;
  consecutivo: string;
  fila: number;
}

export interface ImportResult {
  total: number;
  exitosos: number;
  errores: ImportError[];
  casos: ImportCasoCreado[];
}

// ─── Fase 11: Reporte / exportación ──────────────────────────────────────────

export interface ReporteRow {
  consecutivo: string;
  pais_codigo: string;
  estado: string;
  mes_solicitud: string;
  created_at: string;
  medico_nombre: string;
  medico_email: string;
  medico_institucion?: string | null;
  paciente_nombre: string;
  paciente_tipo_doc?: string | null;
  paciente_num_doc?: string | null;
  paciente_autorizacion?: string | null;
  tiene_indicacion_genetica?: boolean | null;
  resultado_serico_1?: string | null;
  interpretacion_serico?: string | null;
  estado_genetico?: string | null;
  seguimiento_clinico?: string | null;
  programas: { nombre: string; codigo: string };
}
