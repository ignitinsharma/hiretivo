import { apiClient } from '@/lib/axios';
import type { ChangePasswordInput } from '@/lib/validations/interview.schema';
import type { UserRole } from '@/constants/enums';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: UserRole;
}

export interface SessionResponse {
  user?: {
    role?: UserRole;
    name?: string | null;
    email?: string | null;
    plan?: string;
  };
}

export interface EmailVerificationStatus {
  email: string | null;
  isVerified: boolean;
  requiresVerification: boolean;
  verifiedAt: string | null;
  hasGoogleAccount: boolean;
}

export const authService = {
  getSession: async (): Promise<SessionResponse> => {
    const { data } = await apiClient.get<SessionResponse>('/auth/session');
    return data;
  },

  register: async (payload: RegisterInput): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  changePassword: async (payload: ChangePasswordInput): Promise<void> => {
    await apiClient.patch('/auth/change-password', payload);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/reset-password/request', { email });
  },

  confirmPasswordReset: async (input: {
    email: string;
    token: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.post('/auth/reset-password/confirm', input);
  },

  getEmailVerificationStatus: async (): Promise<EmailVerificationStatus> => {
    const { data } = await apiClient.get<{ data: EmailVerificationStatus }>(
      '/auth/email-verification/status',
    );
    return data.data;
  },

  resendVerificationEmail: async (): Promise<void> => {
    await apiClient.post('/auth/email-verification/resend');
  },
};
