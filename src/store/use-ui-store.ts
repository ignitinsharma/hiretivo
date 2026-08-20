import { create } from 'zustand';

interface UIState {
  isApplyModalOpen: boolean;
  applyJobId: string | null;
  selectedJobId: string | null;
  selectedJobTitle: string;
  selectedCompanyName: string;
  selectedExternalApplyUrl: string | null;
  showExternalConfirm: boolean;
  openApplyModal: (jobId: string, title?: string, companyName?: string, externalApplyUrl?: string | null) => void;
  closeApplyModal: () => void;

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
