import { api } from './api';

export type ConsentTemplateType = 'MEDICO' | 'PACIENTE';

export interface ConsentTemplate {
  id: string;
  programaCodigo: string;
  paisCodigo: string;
  tipo: ConsentTemplateType;
  titulo: string;
  cuerpoHtml: string;
  version: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateConsentTemplateDto {
  programaCodigo: string;
  paisCodigo: string;
  tipo: ConsentTemplateType;
  titulo: string;
  cuerpoHtml: string;
}

export const consentTemplatesService = {
  list: () => api.get<{ data: ConsentTemplate[] }>('/consent-templates').then(r => r.data.data),
  get: (id: string) => api.get<{ data: ConsentTemplate }>(`/consent-templates/${id}`).then(r => r.data.data),
  create: (dto: CreateConsentTemplateDto) => api.post<{ data: ConsentTemplate }>('/consent-templates', dto).then(r => r.data.data),
  update: (id: string, dto: Partial<CreateConsentTemplateDto>) => api.patch<{ data: ConsentTemplate }>(`/consent-templates/${id}`, dto).then(r => r.data.data),
  activate: (id: string) => api.patch(`/consent-templates/${id}/activate`),
};
