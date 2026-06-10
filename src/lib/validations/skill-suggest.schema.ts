import { z } from 'zod';

export const SkillSuggestSchema = z.object({
  descriptionText: z.string().min(10).max(5000),
});

export type SkillSuggestInput = z.infer<typeof SkillSuggestSchema>;

/*
 * SkillSuggestOutputSchema
 * Validates the tiered JSON object returned by the AI model.
 * core = must-have skills, secondary = nice-to-have / adjacent skills.
 */
export const SkillSuggestOutputSchema = z.object({
  core: z.array(z.string()),
  secondary: z.array(z.string()),
});

export type SkillSuggestOutput = z.infer<typeof SkillSuggestOutputSchema>;
