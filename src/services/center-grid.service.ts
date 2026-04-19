import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single service → agent mapping stored inside a CenterGrid. */
export interface ServiceMapping {
  serviceName:   string;
  /** Username of the DELIVERY-group agent who resolves tickets. */
  deliveryAgent: string;
  /** Username of the OPS-group agent who raised / monitors tickets. */
  opsAgent:      string;
}

/**
 * A project service entry returned by
 * GET /projects/{projectCode}/services?active=true
 */
export interface ProjectService {
  serviceName:      string;
  escalationType:   string;
  slaLevel1Minutes: number;
  slaLevel2Minutes: number;
  active:           boolean;
}

export interface CenterCodeItem {
  centerCode: string;
  centerName: string;
  state:      string;
  city:       string;
}

export interface CenterGridResponse {
  id:              number;
  projectCode:     string;
  centerCode:      string;
  centerName:      string;
  state:           string;
  city:            string;
  centerAddress:   string;
  csupName:        string;
  csupNumber:      string;
  totalCandidate:  number;
  examDates:       string;
  serviceMappings: ServiceMapping[];
  createdAt:       string;
  updatedAt:       string;
}

/** Used for both create (POST) and update (PUT /{id}). */
export interface CenterGridPayload {
  projectCode:     string;
  centerCode:      string;
  centerName:      string;
  state:           string;
  city:            string;
  centerAddress:   string;
  csupName:        string;
  csupNumber:      string;
  totalCandidate:  number;
  examDates:       string;
  serviceMappings: ServiceMapping[];
}

/** Query params for GET / */
export interface CenterGridFilters {
  search?:       string;
  projectCodes?: string; // CSV
  centerCodes?:  string; // CSV
  serviceNames?: string; // CSV
  page?:         number;
  size?:         number;
}

export interface CenterGridPage {
  content:       CenterGridResponse[];
  pageNumber:    number;
  pageSize:      number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const centerGridService = {
  /**
   * List centre grids with optional server-side filters + pagination.
   * GET /center-grids
   */
  getAll: (filters?: CenterGridFilters) =>
    api.get<ApiEnvelope<CenterGridPage>>('/center-grids', { params: filters }),

  /**
   * Get a single centre grid by database ID.
   * GET /center-grids/{id}
   */
  getById: (id: number) =>
    api.get<ApiEnvelope<CenterGridResponse>>(`/center-grids/${id}`),

  /**
   * Create a new centre grid.
   * POST /center-grids
   */
  create: (payload: CenterGridPayload) =>
    api.post<ApiEnvelope<CenterGridResponse>>('/center-grids', payload),

  /**
   * Update an existing centre grid.
   * PUT /center-grids/{id}
   */
  update: (id: number, payload: CenterGridPayload) =>
    api.put<ApiEnvelope<CenterGridResponse>>(`/center-grids/${id}`, payload),

  /**
   * Delete a centre grid by database ID.
   * DELETE /center-grids/{id}
   */
  delete: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/center-grids/${id}`),

  /**
   * Fetch services enabled for a project (used to populate service-mapping dropdown).
   * GET /projects/{projectCode}/services?active=true
   */
  getProjectServices: (projectCode: string) =>
    api.get<ApiEnvelope<ProjectService[]>>(`/projects/services?projectCode=${projectCode}`, {
      params: { active: true },
    }),

  /** Returns center code + name pairs for a given project code (for filter dropdown). */
  getCodes: (projectCode: string) =>
    api.get<ApiEnvelope<CenterCodeItem[]>>('/center-grids/codes', {
      params: { projectCode },
    }),

  /**
   * Check whether a (projectCode, centerCode) pair already exists.
   * GET /center-grids/check-existence?projectCode=...&centerCode=...
   * Returns ApiEnvelope<boolean>
   */
  checkExistence: (projectCode: string, centerCode: string) =>
    api.get<ApiEnvelope<boolean>>('/center-grids/check-existence', {
      params: { projectCode, centerCode },
    }),

  /**
   * Check whether a service mapping already exists for a centre.
   * GET /center-grids/check-service?projectCode=...&centerCode=...&serviceName=...
   * Returns ApiEnvelope<boolean>
   */
  checkService: (projectCode: string, centerCode: string, serviceName: string) =>
    api.get<ApiEnvelope<boolean>>('/center-grids/check-service', {
      params: { projectCode, centerCode, serviceName },
    }),

  /**
   * Export centre grids as an Excel file (.xlsx).
   * GET /center-grids/export — returns binary blob.
   * Array params are sent as repeated keys: projectCodes=A&projectCodes=B
   */
  export: (filters: {
    projectCodes?: string[];
    centerCodes?:  string[];
    serviceNames?: string[];
    states?:       string[];
    cities?:       string[];
    search?:       string;
  }) => {
    const p = new URLSearchParams();
    filters.projectCodes?.forEach((v) => p.append('projectCodes', v));
    filters.centerCodes?.forEach((v)  => p.append('centerCodes',  v));
    filters.serviceNames?.forEach((v) => p.append('serviceNames', v));
    filters.states?.forEach((v)       => p.append('states',       v));
    filters.cities?.forEach((v)       => p.append('cities',       v));
    if (filters.search) p.set('search', filters.search);
    return api.get('/center-grids/export', { params: p, responseType: 'blob' });
  },
};
