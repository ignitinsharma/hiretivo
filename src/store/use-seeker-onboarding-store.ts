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
  ProofOfWorkData,
  ExperienceData,
  CompensationData,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';
import type {
  ProjectEntry,
  WorkExperienceEntry,
  EducationEntry,
} from '@/lib/validations/seeker-onboarding.schema';

interface SeekerOnboardingState {
  currentStep: SeekerOnboardingStep;
  isCompleted: boolean;
  userName: string;

  // Legacy slices (steps 1-4 of old flow) — kept for backward compat
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;

  // New slices (7-step verified-engineer flow)
  proofOfWork: ProofOfWorkData;
  experience: ExperienceData;
  compensation: CompensationData;

  initializeOnboarding: (data: {
    currentStep: SeekerOnboardingStep;
    userName?: string;
    step1?: Partial<Step1Data>;
    step2?: Partial<Step2Data>;
    step3?: Partial<Step3Data>;
    step4?: Partial<Step4Data>;
    proofOfWork?: Partial<ProofOfWorkData>;
    experience?: Partial<ExperienceData>;
    compensation?: Partial<CompensationData>;
  }) => void;

  setCurrentStep: (step: SeekerOnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  setUserName: (name: string) => void;

  // Step 1 setters
  setSituation: (situation: SeekerSituation) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;

  // Step 2 setters
  setPrimaryRole: (role: string) => void;
  setYearsOfExperience: (years: YearsOfExperience) => void;
  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;

  // Legacy step 3 setter (resume)
  setResume: (resume: ResumeFile | null) => void;

  // Legacy step 4 setters (job preferences)
  setJobType: (type: JobType) => void;
  setCategory: (category: JobCategory) => void;
  setSalaryRange: (min: number | null, max: number | null) => void;
  setCurrency: (currency: Currency) => void;
  setAvailability: (availability: Availability) => void;

  // ProofOfWork setters (new step 3)
  setGithubUrl: (url: string) => void;
  setLinkedinUrl: (url: string | null) => void;
  setWebsiteUrl: (url: string | null) => void;
  setVideoIntroUrl: (url: string | null) => void;
  addProject: (project: ProjectEntry) => void;
  updateProject: (index: number, project: ProjectEntry) => void;
  removeProject: (index: number) => void;

  // Experience setters (new step 4)
  addWorkExperience: (exp: WorkExperienceEntry) => void;
  updateWorkExperience: (index: number, exp: WorkExperienceEntry) => void;
  removeWorkExperience: (index: number) => void;
  addEducation: (edu: EducationEntry) => void;
  updateEducation: (index: number, edu: EducationEntry) => void;
  removeEducation: (index: number) => void;

  // Compensation setters (new step 5)
  setHeadline: (headline: string) => void;
  setBio: (bio: string) => void;
  setSalaryMinMax: (min: number | null, max: number | null) => void;
  setCompensationAvailability: (availability: string | null) => void;
  setContractType: (contractType: string | null) => void;
  setCompensationResume: (resume: ResumeFile | null) => void;

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

const initialProofOfWorkData: ProofOfWorkData = {
  githubUrl: '',
  linkedinUrl: null,
  websiteUrl: null,
  videoIntroUrl: null,
  projects: [],
};

const initialExperienceData: ExperienceData = {
  workExperiences: [],
  educations: [],
};

const initialCompensationData: CompensationData = {
  headline: '',
  bio: '',
  salaryMin: null,
  salaryMax: null,
  availability: null,
  contractType: null,
  resume: null,
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
    proofOfWork: initialProofOfWorkData,
    experience: initialExperienceData,
    compensation: initialCompensationData,

    /*
     * initializeOnboarding
     * Hydrates the store with persisted onboarding data (e.g. from DB on page load).
     * Merges each slice with its initial defaults so partial data is safe.
     */
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
      proofOfWork: { ...initialProofOfWorkData, ...data.proofOfWork },
      experience: { ...initialExperienceData, ...data.experience },
      compensation: { ...initialCompensationData, ...data.compensation },
    }),

    setCurrentStep: (step) => set({ currentStep: step }),

    nextStep: () => {
      const { currentStep } = get();
      if (currentStep < 7) {
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

    // -------------------------------------------------------------------------
    // Step 1 setters
    // -------------------------------------------------------------------------

    setSituation: (situation) => set((state) => ({
      step1: { ...state.step1, situation },
    })),

    setExperienceLevel: (level) => set((state) => ({
      step1: { ...state.step1, experienceLevel: level },
    })),

    // -------------------------------------------------------------------------
    // Step 2 setters
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Legacy step 3 setter (resume — old flow)
    // -------------------------------------------------------------------------

    setResume: (resume) => set((state) => ({
      step3: { ...state.step3, resume },
    })),

    // -------------------------------------------------------------------------
    // Legacy step 4 setters (job preferences — old flow)
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // ProofOfWork setters (new step 3)
    // -------------------------------------------------------------------------

    setGithubUrl: (url) => set((state) => ({
      proofOfWork: { ...state.proofOfWork, githubUrl: url },
    })),

    setLinkedinUrl: (url) => set((state) => ({
      proofOfWork: { ...state.proofOfWork, linkedinUrl: url },
    })),

    setWebsiteUrl: (url) => set((state) => ({
      proofOfWork: { ...state.proofOfWork, websiteUrl: url },
    })),

    setVideoIntroUrl: (url) => set((state) => ({
      proofOfWork: { ...state.proofOfWork, videoIntroUrl: url },
    })),

    addProject: (project) => set((state) => ({
      proofOfWork: {
        ...state.proofOfWork,
        projects: [...state.proofOfWork.projects, project],
      },
    })),

    updateProject: (index, project) => set((state) => ({
      proofOfWork: {
        ...state.proofOfWork,
        projects: state.proofOfWork.projects.map((p, i) => (i === index ? project : p)),
      },
    })),

    removeProject: (index) => set((state) => ({
      proofOfWork: {
        ...state.proofOfWork,
        projects: state.proofOfWork.projects.filter((_, i) => i !== index),
      },
    })),

    // -------------------------------------------------------------------------
    // Experience setters (new step 4)
    // -------------------------------------------------------------------------

    addWorkExperience: (exp) => set((state) => ({
      experience: {
        ...state.experience,
        workExperiences: [...state.experience.workExperiences, exp],
      },
    })),

    updateWorkExperience: (index, exp) => set((state) => ({
      experience: {
        ...state.experience,
        workExperiences: state.experience.workExperiences.map((e, i) => (i === index ? exp : e)),
      },
    })),

    removeWorkExperience: (index) => set((state) => ({
      experience: {
        ...state.experience,
        workExperiences: state.experience.workExperiences.filter((_, i) => i !== index),
      },
    })),

    addEducation: (edu) => set((state) => ({
      experience: {
        ...state.experience,
        educations: [...state.experience.educations, edu],
      },
    })),

    updateEducation: (index, edu) => set((state) => ({
      experience: {
        ...state.experience,
        educations: state.experience.educations.map((e, i) => (i === index ? edu : e)),
      },
    })),

    removeEducation: (index) => set((state) => ({
      experience: {
        ...state.experience,
        educations: state.experience.educations.filter((_, i) => i !== index),
      },
    })),

    // -------------------------------------------------------------------------
    // Compensation setters (new step 5)
    // -------------------------------------------------------------------------

    setHeadline: (headline) => set((state) => ({
      compensation: { ...state.compensation, headline },
    })),

    setBio: (bio) => set((state) => ({
      compensation: { ...state.compensation, bio },
    })),

    setSalaryMinMax: (min, max) => set((state) => ({
      compensation: { ...state.compensation, salaryMin: min, salaryMax: max },
    })),

    setCompensationAvailability: (availability) => set((state) => ({
      compensation: { ...state.compensation, availability },
    })),

    setContractType: (contractType) => set((state) => ({
      compensation: { ...state.compensation, contractType },
    })),

    setCompensationResume: (resume) => set((state) => ({
      compensation: { ...state.compensation, resume },
    })),

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    completeOnboarding: () => set({ isCompleted: true }),

    resetOnboarding: () => set({
      currentStep: 1,
      isCompleted: false,
      userName: 'there',
      step1: initialStep1Data,
      step2: initialStep2Data,
      step3: initialStep3Data,
      step4: initialStep4Data,
      proofOfWork: initialProofOfWorkData,
      experience: initialExperienceData,
      compensation: initialCompensationData,
    }),
  })
);
