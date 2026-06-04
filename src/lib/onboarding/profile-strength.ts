export type StrengthTier = 'Starter' | 'Basic' | 'Intermediate' | 'Strong' | 'Expert'

export interface ProfileStrengthResult {
  percentage: number
  tier: StrengthTier
  nextAction: string
  filledWeight: number
}

/*
 * computeOnboardingStrength
 * Computes live profile strength from onboarding store state.
 * Used in the side rail to show real-time feedback as the engineer fills their profile.
 * Returns percentage (0-100), tier label, and next recommended action.
 */
export function computeOnboardingStrength(state: {
  step1: { situation: string | null; experienceLevel: string | null; city?: string | null; state?: string | null }
  step2: { primaryRole: string; yearsOfExperience: string | null; skills: string[] }
  proofOfWork: { githubUrl: string; projects: Array<unknown> }
  experience: { workExperiences: Array<unknown> }
  compensation: {
    headline: string
    bio: string
    salaryMin: number | null
    salaryMax: number | null
    availability: string | null
    resume: unknown | null
  }
}): ProfileStrengthResult {
  let filledWeight = 0

  // Group A — About you (12 total)
  if (state.step1.situation) filledWeight += 4
  if (state.step1.experienceLevel) filledWeight += 4
  if (state.step1.city && state.step1.state) filledWeight += 4

  // Group B — Role & skills (18 total)
  if (state.step2.primaryRole.trim().length > 0) filledWeight += 6
  if (state.step2.yearsOfExperience) filledWeight += 6
  if (state.step2.skills.length >= 1) filledWeight += 6

  // Group C — Proof of work (25 total)
  const githubValid =
    state.proofOfWork.githubUrl.trim().length > 0 &&
    state.proofOfWork.githubUrl.startsWith('https://github.com')
  if (githubValid) filledWeight += 15
  if (state.proofOfWork.projects.length >= 1) filledWeight += 10

  // Group D — Experience (20 total)
  if (state.experience.workExperiences.length >= 1) filledWeight += 20

  // Group E — Compensation (25 total)
  if (state.compensation.salaryMin !== null) filledWeight += 5
  if (state.compensation.salaryMax !== null) filledWeight += 5
  if (state.compensation.availability) filledWeight += 5
  if (state.compensation.headline.trim().length > 0) filledWeight += 5
  if (state.compensation.bio.trim().length > 20) filledWeight += 5

  const percentage = Math.min(100, filledWeight)

  const tier: StrengthTier =
    percentage <= 20
      ? 'Starter'
      : percentage <= 40
        ? 'Basic'
        : percentage <= 60
          ? 'Intermediate'
          : percentage <= 80
            ? 'Strong'
            : 'Expert'

  let nextAction: string
  if (!state.proofOfWork.githubUrl.startsWith('https://github.com')) {
    nextAction = "Add your GitHub profile to reach Strong — it's the #1 reviewer signal"
  } else if (state.proofOfWork.projects.length === 0) {
    nextAction = 'Add at least 1 project to boost your approval odds by 3×'
  } else if (state.experience.workExperiences.length === 0) {
    nextAction = 'Add work experience to build reviewer trust'
  } else if (state.compensation.bio.trim().length <= 20) {
    nextAction = 'Write a bio (20+ chars) to complete your profile'
  } else if (state.compensation.headline.trim().length === 0) {
    nextAction = 'Add a professional headline'
  } else if (state.compensation.salaryMin === null) {
    nextAction = 'Set your salary expectation in USD'
  } else if (state.compensation.availability === null) {
    nextAction = 'Set your availability'
  } else {
    nextAction = 'Your profile is strong — submit for verification!'
  }

  return { percentage, tier, nextAction, filledWeight }
}
