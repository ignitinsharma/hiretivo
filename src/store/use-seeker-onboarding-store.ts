import { create } from 'zustand';
import { CurrencyCode } from '@/constants/enums';
import type {
  SeekerOnboardingStep,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  SeekerSituation,
  ExperienceLevel,
  YearsOfExperience,
  JobType,
  JobCategory,
  Currency,
  Availability,
  ResumeFile,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

interface SeekerOnboardingState {
  currentStep: SeekerOnboardingStep;
  isCompleted: boolean;
  userName: string;
  
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;

  initializeOnboarding: (data: {
    currentStep: SeekerOnboardingStep;
    userName?: string;
    step1?: Partial<Step1Data>;
    step2?: Partial<Step2Data>;
    step3?: Partial<Step3Data>;
    step4?: Partial<Step4Data>;
  }) => void;

  setCurrentStep: (step: SeekerOnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  setUserName: (name: string) => void;

  setSituation: (situation: SeekerSituation) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;

  setPrimaryRole: (role: string) => void;
  setYearsOfExperience: (years: YearsOfExperience) => void;
  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;

  setResume: (resume: ResumeFile | null) => void;

  setJobType: (type: JobType) => void;
  setCategory: (category: JobCategory) => void;
  setSalaryRange: (min: number | null, max: number | null) => void;
  setCurrency: (currency: Currency) => void;
  setAvailability: (availability: Availability) => void;

  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialStep1Data: Step1Data = {
  situation: null,
  experienceLevel: null,
};

const initialStep2Data: Step2Data = {
  primaryRole: '',
  yearsOfExperience: null,
  skills: [],
};

const initialStep3Data: Step3Data = {
  resume: null,
};

const initialStep4Data: Step4Data = {
  jobType: null,
  category: null,
  salaryRange: { min: null, max: null, currency: CurrencyCode.USD },
  availability: null,
};

export const useSeekerOnboardingStore = create<SeekerOnboardingState>()(
    (set, get) => ({
      currentStep: 1,
      isCompleted: false,
      userName: 'there',

      step1: initialStep1Data,
      step2: initialStep2Data,
      step3: initialStep3Data,
      step4: initialStep4Data,

      initializeOnboarding: (data) => set({
        currentStep: data.currentStep,
        isCompleted: false,
        userName: data.userName ?? 'there',
        step1: { ...initialStep1Data, ...data.step1 },
        step2: { ...initialStep2Data, ...data.step2 },
        step3: { ...initialStep3Data, ...data.step3 },
        step4: {
          ...initialStep4Data,
          ...data.step4,
          salaryRange: {
            ...initialStep4Data.salaryRange,
            ...data.step4?.salaryRange,
          },
        },
      }),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 5) {
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

      setSituation: (situation) => set((state) => ({
        step1: { ...state.step1, situation },
      })),

      setExperienceLevel: (level) => set((state) => ({
        step1: { ...state.step1, experienceLevel: level },
      })),

      setPrimaryRole: (role) => set((state) => ({
        step2: { ...state.step2, primaryRole: role },
      })),

      setYearsOfExperience: (years) => set((state) => ({
        step2: { ...state.step2, yearsOfExperience: years },
      })),

      setSkills: (skills) => set((state) => ({
        step2: { ...state.step2, skills },
      })),

      addSkill: (skill) => set((state) => ({
        step2: {
          ...state.step2,
          skills: [...state.step2.skills, skill],
        },
      })),

      removeSkill: (skill) => set((state) => ({
        step2: {
          ...state.step2,
          skills: state.step2.skills.filter((s) => s !== skill),
        },
      })),

      setResume: (resume) => set((state) => ({
        step3: { ...state.step3, resume },
      })),

      setJobType: (type) => set((state) => ({
        step4: { ...state.step4, jobType: type },
      })),

      setCategory: (category) => set((state) => ({
        step4: { ...state.step4, category },
      })),

      setSalaryRange: (min, max) => set((state) => ({
        step4: {
          ...state.step4,
          salaryRange: { ...state.step4.salaryRange, min, max },
        },
      })),

      setCurrency: (currency) => set((state) => ({
        step4: {
          ...state.step4,
          salaryRange: { ...state.step4.salaryRange, currency },
        },
      })),

      setAvailability: (availability) => set((state) => ({
        step4: { ...state.step4, availability },
      })),

      completeOnboarding: () => set({ isCompleted: true }),

      resetOnboarding: () => set({
        currentStep: 1,
        isCompleted: false,
        userName: 'there',
        step1: initialStep1Data,
        step2: initialStep2Data,
        step3: initialStep3Data,
        step4: initialStep4Data,
      }),
    })
);
