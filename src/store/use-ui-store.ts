import { create } from 'zustand';

interface UIState {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;

  isAddCustomJobModalOpen: boolean;
  openAddCustomJobModal: () => void;
  closeAddCustomJobModal: () => void;

  isApplyModalOpen: boolean;
  applyJobId: string | null;
  selectedJobId: string | null;
  selectedJobTitle: string;
  selectedCompanyName: string;
  selectedExternalApplyUrl: string | null;
  showExternalConfirm: boolean;
  openApplyModal: (jobId: string, title?: string, companyName?: string, externalApplyUrl?: string | null) => void;
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
    feature: string | null;
    title: string;
    description: string;
  };
  openPaidFeatureModal: (input: {
    feature: string;
    title?: string;
    description?: string;
  }) => void;
  closePaidFeatureModal: () => void;

  isEmailVerificationModalOpen: boolean;
  openEmailVerificationModal: () => void;
  closeEmailVerificationModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoginModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  isAddCustomJobModalOpen: false,
  openAddCustomJobModal: () => set({ isAddCustomJobModalOpen: true }),
  closeAddCustomJobModal: () => set({ isAddCustomJobModalOpen: false }),

  isApplyModalOpen: false,
  applyJobId: null,
  selectedJobId: null,
  selectedJobTitle: '',
  selectedCompanyName: '',
  selectedExternalApplyUrl: null,
  showExternalConfirm: false,
  openApplyModal: (jobId, title, companyName, externalApplyUrl) => {
    // Open the company site immediately so the user lands there without an
    // extra click. The modal then asks whether they completed the application.
    if (externalApplyUrl && typeof window !== 'undefined') {
      window.open(externalApplyUrl, '_blank', 'noopener,noreferrer');
    }
    set({
      isApplyModalOpen: true,
      applyJobId: jobId,
      selectedJobId: jobId,
      selectedJobTitle: title ?? '',
      selectedCompanyName: companyName ?? '',
      selectedExternalApplyUrl: externalApplyUrl ?? null,
      showExternalConfirm: true,
    });
  },
  closeApplyModal: () => set({
    isApplyModalOpen: false,
    applyJobId: null,
    selectedJobId: null,
    selectedJobTitle: '',
    selectedCompanyName: '',
    selectedExternalApplyUrl: null,
    showExternalConfirm: false,
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
      title: title ?? "Upgrade required",
      description: description ?? "Upgrade your plan to access this feature.",
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

  isEmailVerificationModalOpen: false,
  openEmailVerificationModal: () => set({ isEmailVerificationModalOpen: true }),
  closeEmailVerificationModal: () => set({ isEmailVerificationModalOpen: false }),
}));
