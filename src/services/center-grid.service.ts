import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CenterCodeItem {
  centerCode: string;
  centerName: string;
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
  serviceMappings: Record<string, string>; // ServiceName → AgentEmail
  createdAt:       string;
  updatedAt:       string;
}

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
  serviceMappings: Record<string, string>;
}

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
  getAll: (filters?: CenterGridFilters) =>
    api.get<ApiEnvelope<CenterGridPage>>('/center-grids', { params: filters }),

  getById: (id: number) =>
    api.get<ApiEnvelope<CenterGridResponse>>(`/center-grids/${id}`),

  create: (payload: CenterGridPayload) =>
    api.post<ApiEnvelope<CenterGridResponse>>('/center-grids', payload),

  update: (id: number, payload: CenterGridPayload) =>
    api.put<ApiEnvelope<CenterGridResponse>>(`/center-grids/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/center-grids/${id}`),

  /** Returns true if projectCode + centerCode combination already exists */
  checkExistence: (projectCode: string, centerCode: string) =>
    api.get<ApiEnvelope<boolean>>('/center-grids/check-existence', {
      params: { projectCode, centerCode },
    }),

  /** Returns true if serviceName is already mapped to the given center */
  checkService: (projectCode: string, centerCode: string, serviceName: string) =>
    api.get<ApiEnvelope<boolean>>('/center-grids/check-service', {
      params: { projectCode, centerCode, serviceName },
    }),

  /** Returns center code + name pairs for a given project code (for filter dropdown) */
  getCodes: (projectCode: string) =>
    api.get<ApiEnvelope<CenterCodeItem[]>>('/center-grids/codes', {
      params: { projectCode },
    }),
};
