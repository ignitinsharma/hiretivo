import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OnboardingStep,
  Step1Data,
  Step2Data,
  Step3Data,
  RecruiterRole,
  HiringScale,
  CompanySize,
  Industry,
  FundingType,
  JobType,
  ExperienceLevel,
  JobCategory,
} from '@/modules/onboarding/types/onboarding.types';

interface OnboardingState {
  currentStep: OnboardingStep;
  isCompleted: boolean;

  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;

  setCurrentStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;

  setRole: (role: RecruiterRole) => void;
  setHiringScale: (scale: HiringScale) => void;
  setCompanyName: (name: string) => void;
  setCompanyWebsite: (website: string) => void;
  setCompanySize: (size: CompanySize) => void;
  setIndustry: (industry: Industry) => void;
  setFundingType: (funding: FundingType) => void;
  setIsFullyRemote: (isRemote: boolean) => void;
  setLogoUrl: (url: string | null) => void;

  setJobTitle: (title: string) => void;
  setJobType: (type: JobType) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setCategory: (category: JobCategory) => void;
  setSalaryRange: (min: number | null, max: number | null) => void;
  setJobDescription: (description: string) => void;
  setRequiredSkills: (skills: string[]) => void;
  addRequiredSkill: (skill: string) => void;
  removeRequiredSkill: (skill: string) => void;

  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialStep1Data: Step1Data = {
  role: null,
  hiringScale: null,
};

const initialStep2Data: Step2Data = {
  companyName: '',
  companyWebsite: '',
  companySize: null,
  industry: null,
  fundingType: null,
  isFullyRemote: false,
  logoUrl: null,
};

const initialStep3Data: Step3Data = {
  jobTitle: '',
  jobType: null,
  experienceLevel: null,
  category: null,
  salaryRange: { min: null, max: null },
  jobDescription: '',
  requiredSkills: [],
};

function migratePersistedState(persisted: unknown): unknown {
  if (!persisted || typeof persisted !== 'object') {
    return persisted;
  }
  const s = persisted as Record<string, unknown>;
  if (typeof s.currentStep === 'number' && s.currentStep > 4) {
    s.currentStep = 4;
  }
  delete s.step4;
  return persisted;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      isCompleted: false,

      step1: initialStep1Data,
      step2: initialStep2Data,
      step3: initialStep3Data,

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
          set({ currentStep: (currentStep + 1) as OnboardingStep });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as OnboardingStep });
        }
      },

      updateStep1: (data) => set((state) => ({
        step1: { ...state.step1, ...data },
      })),

      updateStep2: (data) => set((state) => ({
        step2: { ...state.step2, ...data },
      })),

      updateStep3: (data) => set((state) => ({
        step3: { ...state.step3, ...data },
      })),

      setRole: (role) => set((state) => ({
        step1: { ...state.step1, role },
      })),

      setHiringScale: (scale) => set((state) => ({
        step1: { ...state.step1, hiringScale: scale },
      })),

      setCompanyName: (name) => set((state) => ({
        step2: { ...state.step2, companyName: name },
      })),

      setCompanyWebsite: (website) => set((state) => ({
        step2: { ...state.step2, companyWebsite: website },
      })),

      setCompanySize: (size) => set((state) => ({
        step2: { ...state.step2, companySize: size },
      })),

      setIndustry: (industry) => set((state) => ({
        step2: { ...state.step2, industry },
      })),

      setFundingType: (funding) => set((state) => ({
        step2: { ...state.step2, fundingType: funding },
      })),

      setIsFullyRemote: (isRemote) => set((state) => ({
        step2: { ...state.step2, isFullyRemote: isRemote },
      })),

      setLogoUrl: (url) => set((state) => ({
        step2: { ...state.step2, logoUrl: url },
      })),

      setJobTitle: (title) => set((state) => ({
        step3: { ...state.step3, jobTitle: title },
      })),

      setJobType: (type) => set((state) => ({
        step3: { ...state.step3, jobType: type },
      })),

      setExperienceLevel: (level) => set((state) => ({
        step3: { ...state.step3, experienceLevel: level },
      })),

      setCategory: (category) => set((state) => ({
        step3: { ...state.step3, category },
      })),

      setSalaryRange: (min, max) => set((state) => ({
        step3: { ...state.step3, salaryRange: { min, max } },
      })),

      setJobDescription: (description) => set((state) => ({
        step3: { ...state.step3, jobDescription: description },
      })),

      setRequiredSkills: (skills) => set((state) => ({
        step3: { ...state.step3, requiredSkills: skills },
      })),

      addRequiredSkill: (skill) => set((state) => ({
        step3: {
          ...state.step3,
          requiredSkills: [...state.step3.requiredSkills, skill],
        },
      })),

      removeRequiredSkill: (skill) => set((state) => ({
        step3: {
          ...state.step3,
          requiredSkills: state.step3.requiredSkills.filter((s) => s !== skill),
        },
      })),

      completeOnboarding: () => set({ isCompleted: true }),

      resetOnboarding: () => set({
        currentStep: 1,
        isCompleted: false,
        step1: initialStep1Data,
        step2: initialStep2Data,
        step3: initialStep3Data,
      }),
    }),
    {
      name: 'hiretivo-onboarding',
      version: 1,
      migrate: (persistedState, version) => {
        if (version < 1) {
          return migratePersistedState(persistedState) as OnboardingState;
        }
        return persistedState as OnboardingState;
      },
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<OnboardingState> & { step4?: unknown }),
        };
        if (typeof merged.currentStep === 'number' && merged.currentStep > 4) {
          merged.currentStep = 4;
        }
        const { step4: _discard, ...rest } = merged;
        return rest;
      },
    }
  )
);
