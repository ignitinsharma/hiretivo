export function isAiTrialActive(): boolean {
  const end = process.env.AI_TRIAL_ENDS;
  if (!end) return false;
  return new Date() < new Date(end);
}
