import api from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ServiceEscalation {
  id:               number;
  serviceName:      string;
  escalationType:   string;
  active:           boolean;
  slaLevel1Minutes: number;   // minutes until L1 escalation fires
  slaLevel2Minutes: number;   // minutes until L2 escalation fires
  createdAt:        string;   // UTC ISO
  updatedAt:        string;   // UTC ISO
}

/** Filters accepted by GET /service-escalations */
export interface ServiceEscalationFilters {
  search?: string;    // free-text across serviceName + escalationType
  active?: boolean;   // filter by active flag
}

/** Body sent on POST / PUT */
export interface ServiceEscalationPayload {
  serviceName:      string;
  escalationType:   string;
  active:           boolean;
  slaLevel1Minutes: number;
  slaLevel2Minutes: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  traceId: string;
  message: string;
  data:    T;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const serviceEscalationService = {
  /** GET /service-escalations — optional filters: active, search */
  getAll: (filters?: ServiceEscalationFilters) =>
    api.get<ApiEnvelope<ServiceEscalation[]>>('/service-escalations', {
      params: filters,
    }),

  /** GET /service-escalations/{id} */
  getById: (id: number) =>
    api.get<ApiEnvelope<ServiceEscalation>>(`/service-escalations/${id}`),

  /** POST /service-escalations — returns created object with id */
  create: (payload: ServiceEscalationPayload) =>
    api.post<ApiEnvelope<ServiceEscalation>>('/service-escalations', payload),

  /** PUT /service-escalations/{id} — returns updated object */
  update: (id: number, payload: ServiceEscalationPayload) =>
    api.put<ApiEnvelope<ServiceEscalation>>(`/service-escalations/${id}`, payload),

  /** DELETE /service-escalations/{id} */
  delete: (id: number) =>
    api.delete<ApiEnvelope<void>>(`/service-escalations/${id}`),
};
