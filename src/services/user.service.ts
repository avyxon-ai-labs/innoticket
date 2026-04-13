import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole   = 'ADMIN' | 'USER' | 'CLIENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserResponse {
  id:                  number;
  fullName:            string;
  username:            string;
  contact:             string;
  post:                string;
  managerUsername:     string | null;
  roleCode:            UserRole;
  status:              UserStatus;
  isTemporaryPassword: boolean;
  lastLogin:           string | null;
  projectCode:         string | null;
  createdAt:           string;
  updatedAt:           string;
  createdBy:           string;
  updatedBy:           string;
}

export interface UserPayload {
  fullName:        string;
  username:        string;
  password:        string;
  contact:         string;
  post:            string;
  managerUsername: string;
  roleCode:        UserRole;
  status:          UserStatus;
}

export interface UserFilters {
  search?:    string;
  status?:    UserStatus | '';
  roleCodes?: string;   // CSV e.g. "ADMIN,CLIENT"
  page?:      number;   // 0-indexed
  size?:      number;
  sort?:      string;
  direction?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  content:       T[];
  pageNumber:    number;
  pageSize:      number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const userService = {
  getAll: (filters?: UserFilters) =>
    api.get<ApiEnvelope<PageResponse<UserResponse>>>('/users', { params: filters }),

  getById: (id: number) =>
    api.get<ApiEnvelope<UserResponse>>(`/users/${id}`),

  getMe: () =>
    api.get<ApiEnvelope<UserResponse>>('/users/me'),

  create: (payload: UserPayload) =>
    api.post<ApiEnvelope<UserResponse>>('/users', payload),

  update: (id: number, payload: UserPayload) =>
    api.put<ApiEnvelope<UserResponse>>(`/users/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/users/${id}`),
};
