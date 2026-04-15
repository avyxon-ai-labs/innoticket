import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'ACTIVE' | 'INACTIVE';

/**
 * A single service-escalation entry snapshotted into a project.
 * SLA values are stored in minutes.
 */
export interface ProjectService {
  serviceName:      string;
  escalationType:   string;
  slaLevel1Minutes: number;
  slaLevel2Minutes: number;
}

export interface Project {
  id:          number;
  projectName: string;
  projectCode: string;
  username:    string;   // system account identifier
  password:    string;
  status:      ProjectStatus;
  services:    ProjectService[];  // snapshotted at creation/update time
  createdAt:   string;  // UTC ISO
  updatedAt:   string;  // UTC ISO
  createdBy:   string;
  updatedBy:   string;
}

/** Body sent on POST / PUT */
export interface ProjectPayload {
  projectName: string;
  projectCode: string;
  username:    string;
  password:    string;
  status:      ProjectStatus;
  services:    ProjectService[];  // full snapshot — backend persists as-is
}

/** Filters accepted by GET /projects */
export interface ProjectFilters {
  status?:     ProjectStatus | '';
  searchText?: string;
  page?:       number;  // 0-indexed
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
  /** GET /projects — paginated, optional filters */
  getAll: (filters?: ProjectFilters) =>
    api.get<ApiEnvelope<ProjectPage>>('/projects', { params: filters }),

  /** GET /projects/{id} */
  getById: (id: number) =>
    api.get<ApiEnvelope<Project>>(`/projects/${id}`),

  /** POST /projects — creates project + system user, returns object with id */
  create: (payload: ProjectPayload) =>
    api.post<ApiEnvelope<Project>>('/projects', payload),

  /** PUT /projects/{id} — updates project; syncs password to system user if changed */
  update: (id: number, payload: ProjectPayload) =>
    api.put<ApiEnvelope<Project>>(`/projects/${id}`, payload),

  /** DELETE /projects/{id} */
  delete: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/projects/${id}`),
};
