import api from '../lib/api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token:               string;
    username:            string;
    role:                string;
    isTemporaryPassword: boolean;
  };
}

export interface ResetPasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface SetPasswordRequest {
  token:       string;
  newPassword: string;
}

/**
 * Auth service — all auth API calls go through here.
 * Never call api/axios directly from components or stores.
 */
export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post('/auth/reset-password', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post('/auth/forgot-password', data),

  setPassword: (data: SetPasswordRequest) =>
    api.post<{ success: boolean; message: string; data: null }>('/auth/set-password', data),
};
