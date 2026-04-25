import { create } from 'zustand';

import { PAID_FEATURE_COPY } from '@/lib/billing/plan-access';

import type { RecruiterPaidFeature } from '@/constants/enums';

interface UIState {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;

  isApplyModalOpen: boolean;
  applyJobId: string | null;
  selectedJobId: string | null;
  selectedJobTitle: string;
  selectedCompanyName: string;
  openApplyModal: (jobId: string, title?: string, companyName?: string) => void;
  closeApplyModal: () => void;

  isPostJobModalOpen: boolean;
  editJobId: string | null;
  openPostJobModal: () => void;
  openEditJobModal: (jobId: string) => void;
  closePostJobModal: () => void;

  isCandidateDrawerOpen: boolean;
  selectedApplicationId: string | null;
  openCandidateDrawer: (id: string) => void;
  closeCandidateDrawer: () => void;

  isScheduleModalOpen: boolean;
  scheduleInterviewApplicationId: string | null;
  scheduledInterviewId: string | null; // present when rescheduling existing interview
  openScheduleModal: (applicationId: string, interviewId?: string | null) => void;
  closeScheduleModal: () => void;

  paidFeatureModal: {
    isOpen: boolean;
    feature: RecruiterPaidFeature | null;
    title: string;
    description: string;
  };
  openPaidFeatureModal: (input: {
    feature: RecruiterPaidFeature;
    title?: string;
    description?: string;
  }) => void;
  closePaidFeatureModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoginModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  isApplyModalOpen: false,
  applyJobId: null,
  selectedJobId: null,
  selectedJobTitle: '',
  selectedCompanyName: '',
  openApplyModal: (jobId, title, companyName) => set({
    isApplyModalOpen: true,
    applyJobId: jobId,
    selectedJobId: jobId,
    selectedJobTitle: title ?? '',
    selectedCompanyName: companyName ?? '',
  }),
  closeApplyModal: () => set({
    isApplyModalOpen: false,
    applyJobId: null,
    selectedJobId: null,
    selectedJobTitle: '',
    selectedCompanyName: '',
  }),

  isPostJobModalOpen: false,
  editJobId: null,
  openPostJobModal: () => set({ isPostJobModalOpen: true, editJobId: null }),
  openEditJobModal: (jobId) => set({ isPostJobModalOpen: true, editJobId: jobId }),
  closePostJobModal: () => set({ isPostJobModalOpen: false, editJobId: null }),

  isCandidateDrawerOpen: false,
  selectedApplicationId: null,
  openCandidateDrawer: (id) => set({ isCandidateDrawerOpen: true, selectedApplicationId: id }),
  closeCandidateDrawer: () => set({ isCandidateDrawerOpen: false, selectedApplicationId: null }),

  isScheduleModalOpen: false,
  scheduleInterviewApplicationId: null,
  scheduledInterviewId: null,
  openScheduleModal: (applicationId, interviewId) => set({
    isScheduleModalOpen: true,
    scheduleInterviewApplicationId: applicationId,
    scheduledInterviewId: interviewId ?? null,
  }),
  closeScheduleModal: () => set({
    isScheduleModalOpen: false,
    scheduleInterviewApplicationId: null,
    scheduledInterviewId: null,
  }),

  paidFeatureModal: {
    isOpen: false,
    feature: null,
    title: '',
    description: '',
  },
  openPaidFeatureModal: ({ feature, title, description }) => set({
    paidFeatureModal: {
      isOpen: true,
      feature,
      title: title ?? PAID_FEATURE_COPY[feature].title,
      description: description ?? PAID_FEATURE_COPY[feature].description,
    },
  }),
  closePaidFeatureModal: () => set({
    paidFeatureModal: {
      isOpen: false,
      feature: null,
      title: '',
      description: '',
    },
  }),
}));
