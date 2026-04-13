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
  /** Array of row-level errors, or null when no errors */
  errorDetails:  JobErrorDetail[] | null;
  fileUrl:       string | null;
  createdAt:     string;
  updatedAt:     string;
  createdBy:     string;
  updatedBy:     string;
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

// ── Bulk service ──────────────────────────────────────────────────────────────

export type BulkJobType = 'BULK_CENTER_GRID_ADD';

export const bulkService = {
  /** Download the Excel template for a bulk operation */
  downloadTemplate: (jobType: BulkJobType) =>
    api.get(`/bulk/${jobType}/template`, { responseType: 'blob' }),

  /** Upload filled Excel file — returns the initiated JobResponse */
  upload: (jobType: BulkJobType, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<ApiEnvelope<JobResponse>>(`/bulk/${jobType}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
