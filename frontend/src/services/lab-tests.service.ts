import { api } from './api';
import type { ApiResponse } from '@/types/api.types';

export interface LabTest {
  id: string;
  code: string;
  name: string;
  type: 'NIVEL_SERICO' | 'GENETICO' | 'PANEL' | 'IMAGEN' | 'MICROBIOLOGIA' | 'OTRO';
  category: string | null;
  description: string | null;
  instructions: string | null;
  estimatedHours: number | null;
  isActive: boolean;
  requiresResultFromId: string | null;
  requiresResultFrom: { id: string; code: string; name: string; type: string } | null;
  dependentTests: { id: string; code: string; name: string }[];
}

export interface PrerequisiteCheck {
  unlocked: boolean;
  requires: { id: string; code: string; name: string } | null;
}

export async function getLabTests(): Promise<LabTest[]> {
  const { data } = await api.get<ApiResponse<LabTest[]>>('/lab-tests');
  return data.data;
}

export async function checkPrerequisite(
  labTestId: string,
  patientId: string,
): Promise<PrerequisiteCheck> {
  const { data } = await api.get<ApiResponse<PrerequisiteCheck>>(
    `/lab-tests/${labTestId}/prerequisite/${patientId}`,
  );
  return data.data;
}
