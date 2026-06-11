import { z } from 'zod';

export const JdGeneratorSchema = z.object({
  title: z.string().min(2).max(100),
  shortDesc: z.string().min(50).max(500),
  vibe: z.string().max(200).optional(),
  isRegeneration: z.boolean().optional(),
});

export type JdGeneratorInput = z.infer<typeof JdGeneratorSchema>;
