import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'WITHDRAWN'
  | 'REJECTED';

/** Client-side tab concept: ESCALATED = OPEN + IN_PROGRESS combined */
export type TicketTab = 'ESCALATED' | TicketStatus;

/** Maps each tab to the statuses sent to the API */
export const TAB_STATUSES: Record<TicketTab, string[]> = {
  ESCALATED:   ['ESCALATED'],
  OPEN:        ['OPEN'],
  IN_PROGRESS: ['IN_PROGRESS'],
  RESOLVED:    ['RESOLVED'],
  REJECTED:    ['REJECTED'],
  WITHDRAWN:   ['WITHDRAWN'],
  CLOSED:      ['CLOSED'],
};

/** Allowed status transitions (target statuses per current) */
export const STATUS_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED', 'WITHDRAWN', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'WITHDRAWN', 'REJECTED'],
  RESOLVED:    ['CLOSED', 'OPEN'],
  WITHDRAWN:   ['OPEN'],
  REJECTED:    ['OPEN'],
};

export interface UserMiniDto {
  fullName: string;
  username: string;
  contact:  string;
}

export interface Attachment {
  fileName: string;
  fileUrl:  string;
  fileType: string;
  fileSize: number;
}

export interface TicketResponse {
  id:             string;
  description:    string;
  status:         TicketStatus;
  serviceName:    string;
  escalationType: string;

  project: {
    projectCode:    string;
    projectName:    string;
    slaLevel1Hours: number;
    slaLevel2Hours: number;
  };

  center: {
    centerCode: string;
    centerName: string;
    city:       string;
    state:      string;
  };

  creator:    UserMiniDto | null;
  assignedTo: UserMiniDto | null;

  resolvedBy:      string | null;          // username / email of the resolver
  resolvedAt:      string | null;
  resolvedRemarks: string | null;

  totalDurationInMinutes: number | null;
  attachments:            Attachment[];
  escalationLevel:        string | null;   // e.g. "L1", "L2"; null or "NONE" = not escalated
  activeSince:            string | null;   // ISO instant; set when ticket becomes active
  activeEndedAt:          string | null;   // ISO instant; set when ticket is resolved/rejected/withdrawn

  createdAt: string;
}

export interface TicketCreatePayload {
  projectCode:    string;
  centerCode:     string;
  serviceName:    string;
  escalationType: string;
  description:    string;
  attachments:    Attachment[];
}

export interface TicketStatusPayload {
  status:      TicketStatus;
  remarks:     string;
  attachments: Attachment[];
}

export interface TicketCommentPayload {
  comment: string;
}

export type TicketEventType =
  | 'CREATED'
  | 'REOPENED'
  | 'WITHDRAWN'
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'ESCALATED'
  | 'COMMENTED'
  | 'ATTACHMENT_ADDED'
  | 'DESCRIPTION_UPDATED';

export interface TicketEventResponse {
  id:              number;
  eventType:       TicketEventType;
  performedBy:     string;
  performedByName: string;
  metadata:        Record<string, unknown> | null;
  timestamp:       string;
}

export interface TicketPage {
  content:       TicketResponse[];
  totalElements: number;
  totalPages:    number;
  page:          number;
  size:          number;
}

export interface TicketQueryParams {
  page?:         number;
  size?:         number;
  statuses?:     string; // CSV e.g. "OPEN,IN_PROGRESS"
  projectCodes?: string; // CSV (single project enforced in UI)
  centerCodes?:  string; // CSV
  services?:     string; // CSV
  search?:       string;
  states?:       string; // CSV e.g. "Delhi,Uttar Pradesh"
  cities?:       string; // CSV e.g. "Lucknow,Okhla"
  assignedTo?:   string;  // filter by assignee username (My Work — Assigned to Me)
  raisedBy?:     string;  // filter by creator username  (My Work — Raised by Me)
  myTeam?:       boolean; // filter by current user's team (My Work — My Team)
}

// ── Service ───────────────────────────────────────────────────────────────────

export const ticketService = {
  getAll: (params: TicketQueryParams) =>
    api.get<ApiEnvelope<TicketPage>>('/tickets', { params }),

  getById: (id: string) =>
    api.get<ApiEnvelope<TicketResponse>>(`/tickets/${id}`),

  getMyAssigned: () =>
    api.get<ApiEnvelope<TicketResponse[]>>('/tickets/my-assigned'),

  getMyRaised: () =>
    api.get<ApiEnvelope<TicketResponse[]>>('/tickets/my-raised'),

  create: (payload: TicketCreatePayload) =>
    api.post<ApiEnvelope<TicketResponse>>('/tickets', payload),

  updateStatus: (id: string, payload: TicketStatusPayload) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/tickets/${id}/status`, payload),

  addComment: (id: string, payload: TicketCommentPayload) =>
    api.post<ApiEnvelope<unknown>>(`/tickets/${id}/comments`, payload),

  addAttachments: (id: string, attachments: Attachment[]) =>
    api.post<ApiEnvelope<unknown>>(`/tickets/${id}/attachments`, attachments),

  updateDescription: (id: string, description: string) =>
    api.patch<ApiEnvelope<TicketResponse>>(`/tickets/${id}/description`, { description }),

  getEvents: (id: string) =>
    api.get<ApiEnvelope<TicketEventResponse[]>>(`/tickets/${id}/events`),

  uploadFile: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    // The Axios instance defaults to Content-Type: application/json.
    // For multipart uploads we must DELETE that default so the browser can
    // set its own "multipart/form-data; boundary=…" header — the boundary
    // token is required for the server to parse the body correctly.
    return api.post<ApiEnvelope<Attachment>>('/tickets/upload', fd, {
      headers: { 'Content-Type': undefined },
    });
  },
};
