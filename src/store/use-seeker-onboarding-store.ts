import { create } from 'zustand';
import type {
  SeekerOnboardingStep,
  Step1Data,
  Step3Data,
  SeekerSituation,
  ResumeFile,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

interface SeekerOnboardingState {
  currentStep: SeekerOnboardingStep;
  isCompleted: boolean;
  userName: string;
  userEmail: string;

  step1: Step1Data;
  step3: Step3Data;

  initializeOnboarding: (data: {
    currentStep: SeekerOnboardingStep;
    userName?: string;
    userEmail?: string;
    step1?: Partial<Step1Data>;
    step3?: Partial<Step3Data>;
  }) => void;

  setCurrentStep: (step: SeekerOnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  setUserName: (name: string) => void;

  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setLinkedinUrl: (url: string) => void;
  setGithubUrl: (url: string) => void;
  setPortfolioUrl: (url: string | null) => void;
  setSituation: (situation: SeekerSituation) => void;

  setResume: (resume: ResumeFile | null) => void;

  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialStep1Data: Step1Data = {
  name: '',
  phone: '',
  linkedinUrl: '',
  githubUrl: null,
  portfolioUrl: null,
  situation: null,
};

const initialStep3Data: Step3Data = {
  resume: null,
};

export const useSeekerOnboardingStore = create<SeekerOnboardingState>()(
  (set, get) => ({
    currentStep: 1,
    isCompleted: false,
    userName: '',
    userEmail: '',

    step1: initialStep1Data,
    step3: initialStep3Data,

    initializeOnboarding: (data) => set({
      currentStep: data.currentStep,
      isCompleted: false,
      userName: data.userName ?? '',
      userEmail: data.userEmail ?? '',
      step1: { ...initialStep1Data, ...data.step1 },
      step3: { ...initialStep3Data, ...data.step3 },
    }),

    setCurrentStep: (step) => set({ currentStep: step }),

    nextStep: () => {
      const { currentStep } = get();
      if (currentStep < 2) {
        set({ currentStep: (currentStep + 1) as SeekerOnboardingStep });
      }
    },

    previousStep: () => {
      const { currentStep } = get();
      if (currentStep > 1) {
        set({ currentStep: (currentStep - 1) as SeekerOnboardingStep });
      }
    },

    setUserName: (name) => set({ userName: name }),

    setName: (name) => set((state) => ({ step1: { ...state.step1, name } })),
    setPhone: (phone) => set((state) => ({ step1: { ...state.step1, phone } })),
    setLinkedinUrl: (url) => set((state) => ({ step1: { ...state.step1, linkedinUrl: url } })),
    setGithubUrl: (url) => set((state) => ({ step1: { ...state.step1, githubUrl: url } })),
    setPortfolioUrl: (url) => set((state) => ({ step1: { ...state.step1, portfolioUrl: url } })),
    setSituation: (situation) => set((state) => ({ step1: { ...state.step1, situation } })),

    setResume: (resume) => set((state) => ({
      step3: { ...state.step3, resume },
    })),

    completeOnboarding: () => set({ isCompleted: true }),

    resetOnboarding: () => set({
      currentStep: 1,
      isCompleted: false,
      userName: '',
      userEmail: '',
      step1: initialStep1Data,
      step3: initialStep3Data,
    }),
  })
);
