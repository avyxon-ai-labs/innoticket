import api from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ServiceEscalation {
  id:             number;
  serviceName:    string;
  escalationType: string;
  active:         boolean;
  createdAt:      string; // UTC ISO
  updatedAt:      string; // UTC ISO
}

export interface ServiceEscalationFilters {
  serviceName?:    string;
  escalationType?: string;
  search?:         string;
  active?:         boolean;
}

export interface ServiceEscalationPayload {
  serviceName:    string;
  escalationType: string;
  active:         boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  traceId: string;
  message: string;
  data:    T;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const serviceEscalationService = {
  getAll: (filters?: ServiceEscalationFilters) =>
    api.get<ApiEnvelope<ServiceEscalation[]>>('/service-escalations', {
      params: filters,
    }),

  getById: (id: number) =>
    api.get<ApiEnvelope<ServiceEscalation>>(`/service-escalations/${id}`),

  create: (payload: ServiceEscalationPayload) =>
    api.post<ApiEnvelope<ServiceEscalation>>('/service-escalations', payload),

  update: (id: number, payload: ServiceEscalationPayload) =>
    api.put<ApiEnvelope<ServiceEscalation>>(`/service-escalations/${id}`, payload),
};
