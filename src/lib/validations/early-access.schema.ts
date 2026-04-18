import { z } from 'zod';

export const earlyAccessSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type EarlyAccessInput = z.infer<typeof earlyAccessSchema>;
