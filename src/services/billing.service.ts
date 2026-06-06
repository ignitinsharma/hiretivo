import { apiClient } from '@/lib/axios';
import type { BillingPeriod, PlanTier, SubscriptionStatus } from '@/constants/enums';
import type { CheckoutRequestInput } from '@/lib/validations/checkout.schema';

export interface SubscriptionStatusData {
  plan: PlanTier;
  subscription: {
    status: SubscriptionStatus;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    scheduledPlan: string | null;
    scheduledChangeAt: string | null;
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

  createBoostCheckoutSession: async (jobId: string): Promise<string> => {
    const { data } = await apiClient.post<DataResponse<BillingSessionData>>('/billing/boost-checkout', { jobId });
    return getBillingUrl(data);
  },

  /*
   * previewPlanChange
   * Fetches a preview of switching to a given plan: direction, charge today, and period end.
   * @param planId - Target plan product ID
   * @returns Preview data including direction, chargeToday, currentPeriodEnd, optional currency
   */
  previewPlanChange: async (planId: string, period?: BillingPeriod): Promise<{
    direction: "upgrade" | "downgrade";
    chargeToday: number;
    currentPeriodEnd: string;
    currency?: string;
  }> => {
    const url = `/billing/preview-change?planId=${planId}${period ? `&period=${period}` : ""}`;
    const { data } = await apiClient.get<DataResponse<{
      direction: "upgrade" | "downgrade";
      chargeToday: number;
      currentPeriodEnd: string;
      currency?: string;
    }>>(url);
    return data.data;
  },

  /*
   * changePlan
   * Executes an immediate upgrade or schedules a downgrade at period end.
   * @param planId - Target plan product ID
   * @param period - Optional billing period; when provided, the target product uses this period
   * @returns direction and optional scheduledChangeAt (ISO string) for downgrades
   */
  changePlan: async (planId: string, period?: BillingPeriod): Promise<{
    direction: "upgrade" | "downgrade";
    scheduledChangeAt?: string;
    upgradedPlan?: string;
  }> => {
    const { data } = await apiClient.post<DataResponse<{
      direction: "upgrade" | "downgrade";
      scheduledChangeAt?: string;
      upgradedPlan?: string;
    }>>('/billing/change-plan', { planId, ...(period ? { period } : {}) });
    return data.data;
  },
};
