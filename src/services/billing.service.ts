import { apiClient } from '@/lib/axios';
import type { PlanTier, SubscriptionStatus } from '@/constants/enums';
import type { CheckoutRequestInput } from '@/lib/validations/checkout.schema';

export interface SubscriptionStatusData {
  plan: PlanTier;
  subscription: {
    status: SubscriptionStatus;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface DataResponse<T> {
  data: T;
}

interface BillingSessionData {
  url?: string | null;
}

function getBillingUrl(payload: DataResponse<BillingSessionData>): string {
  if (!payload.data.url) {
    throw new Error('Billing is unavailable right now');
  }
  return payload.data.url;
}

export const billingService = {
  getSubscriptionStatus: async (): Promise<SubscriptionStatusData> => {
    const { data } = await apiClient.get<DataResponse<SubscriptionStatusData>>('/billing/subscription-status');
    return data.data;
  },

  createCheckoutSession: async (payload?: CheckoutRequestInput): Promise<string> => {
    const { data } = await apiClient.post<DataResponse<BillingSessionData>>('/billing/checkout', payload);
    return getBillingUrl(data);
  },

  createPortalSession: async (): Promise<string> => {
    const { data } = await apiClient.post<DataResponse<BillingSessionData>>('/billing/portal');
    return getBillingUrl(data);
  },
};
