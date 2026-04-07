import { create } from 'zustand';

interface UIState {
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
}

export const useUIStore = create<UIState>((set) => ({
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
}));