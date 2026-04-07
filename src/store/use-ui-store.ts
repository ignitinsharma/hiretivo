import { create } from 'zustand';

interface UIState {
  isApplyModalOpen: boolean;
  applyJobId: string | null;
  openApplyModal: (jobId: string) => void;
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
  openApplyModal: (jobId) => set({ isApplyModalOpen: true, applyJobId: jobId }),
  closeApplyModal: () => set({ isApplyModalOpen: false, applyJobId: null }),

  isPostJobModalOpen: false,
  editJobId: null,
  openPostJobModal: () => set({ isPostJobModalOpen: true, editJobId: null }),
  openEditJobModal: (jobId) => set({ isPostJobModalOpen: true, editJobId: jobId }),
  closePostJobModal: () => set({ isPostJobModalOpen: false, editJobId: null }),
}));