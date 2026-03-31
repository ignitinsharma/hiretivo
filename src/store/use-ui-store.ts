import { create } from 'zustand';

interface UIState {
  isApplyModalOpen: boolean;
  applyJobId: string | null;
  openApplyModal: (jobId: string) => void;
  closeApplyModal: () => void;

  isPostJobModalOpen: boolean;
  openPostJobModal: () => void;
  closePostJobModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isApplyModalOpen: false,
  applyJobId: null,
  openApplyModal: (jobId) => set({ isApplyModalOpen: true, applyJobId: jobId }),
  closeApplyModal: () => set({ isApplyModalOpen: false, applyJobId: null }),

  isPostJobModalOpen: false,
  openPostJobModal: () => set({ isPostJobModalOpen: true }),
  closePostJobModal: () => set({ isPostJobModalOpen: false }),
}));