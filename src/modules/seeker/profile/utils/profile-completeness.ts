/*
 * getProfileCompleteness
 * Percent of profile sections a seeker has filled — drives the header ring
 * and nudges the seeker to complete Application Defaults before first apply.
 * @param input - flags for each section's presence
 * @returns integer 0-100 (weighted equally across sections)
 */
export interface ProfileCompletenessInput {
  hasBasics: boolean; // name + headline + location
  hasResume: boolean; // resumeKey present
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasApplicationDefaults: boolean; // contact + work-auth answered
}

export function getProfileCompleteness(
  input: ProfileCompletenessInput,
): number {
  const flags = Object.values(input);
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
}
