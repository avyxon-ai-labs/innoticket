import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'ACTIVE' | 'INACTIVE';

export interface Project {
  id:             number;
  projectName:    string;
  projectCode:    string;
  password:       string;
  status:         ProjectStatus;
  slaLevel1Hours: number;
  slaLevel2Hours: number;
  createdAt:      string; // UTC ISO
  updatedAt:      string; // UTC ISO
  createdBy:      string;
  updatedBy:      string;
}

export interface ProjectPayload {
  projectName:    string;
  projectCode:    string;
  password:       string;
  status:         ProjectStatus;
  slaLevel1Hours: number;
  slaLevel2Hours: number;
}

export interface ProjectFilters {
  status?:     ProjectStatus | '';
  searchText?: string;
  page?:       number;   // 0-indexed
  size?:       number;
}

export interface ProjectPage {
  content:       Project[];
  pageNumber:    number;
  pageSize:      number;
  totalElements: number;
  totalPages:    number;
  isLast:        boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const projectService = {
  getAll: (filters?: ProjectFilters) =>
    api.get<ApiEnvelope<ProjectPage>>('/projects', { params: filters }),

  getById: (id: number) =>
    api.get<ApiEnvelope<Project>>(`/projects/${id}`),

  create: (payload: ProjectPayload) =>
    api.post<ApiEnvelope<Project>>('/projects', payload),

  update: (id: number, payload: ProjectPayload) =>
    api.put<ApiEnvelope<Project>>(`/projects/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/projects/${id}`),
};
