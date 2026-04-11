import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type JobType   = 'BULK_USER_ADD' | 'BULK_CENTER_GRID_ADD';
export type JobStatus = 'PENDING' | 'PROGRESS' | 'COMPLETED' | 'FAILED';

export interface JobErrorDetail {
  column:       string;
  rowNumber:    number;
  errorMessage: string;
  invalidValue: string | null;
}

export interface JobResponse {
  id:            number;
  jobType:       JobType;
  status:        JobStatus;
  /** Tilde-separated pipeline steps e.g. "INITIALIZED~DOWNLOADING~PARSING~FAILED" */
  phase:         string;
  totalRows:     number;
  processedRows: number;
  message:       string;
  /** JSON-encoded JobErrorDetail[] or plain string */
  errorDetails:  string;
  fileUrl:       string | null;
  createdAt:     string; // UTC ISO
  updatedAt:     string; // UTC ISO
  createdBy:     string;
  updatedBy:     string;
}

/** Safely parse errorDetails — returns structured array or null */
export function parseErrorDetails(raw: string): JobErrorDetail[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JobErrorDetail[]) : null;
  } catch {
    return null;
  }
}

export interface JobSearchPayload {
  page:       number;
  size:       number;
  jobTypes?:  JobType[];
  statuses?:  JobStatus[];
}

export interface JobPage {
  content:       JobResponse[];
  pageNumber:    number;
  pageSize:      number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const jobService = {
  /** Individual job — polled every 2 s until terminal state */
  getById: (id: number) =>
    api.get<ApiEnvelope<JobResponse>>(`/jobs/${id}`),

  /** Paginated audit log */
  search: (payload: JobSearchPayload) =>
    api.post<ApiEnvelope<JobPage>>('/jobs/search', payload),

  /** Bulk delete by IDs */
  deleteBatch: (ids: number[]) =>
    api.post<ApiEnvelope<null>>('/jobs/delete-batch', ids),
};
