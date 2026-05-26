import { apiClient } from '@/lib/axios';
import type { EarlyAccessInput } from '@/lib/validations/early-access.schema';

export const earlyAccessService = {
  joinWaitlist: async (payload: EarlyAccessInput): Promise<void> => {
    await apiClient.post('/early-access', payload);
  },
};
