import { z } from 'zod';

export const SkillSuggestSchema = z.object({
  descriptionText: z.string().min(10).max(5000),
});

export type SkillSuggestInput = z.infer<typeof SkillSuggestSchema>;
