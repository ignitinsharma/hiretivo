import { z } from 'zod';

export const RequestResetSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const ConfirmResetSchema = z.object({
  email: z.string().email().toLowerCase(),
  token: z.string().min(20),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72),
});

export type RequestResetInput = z.infer<typeof RequestResetSchema>;
export type ConfirmResetInput = z.infer<typeof ConfirmResetSchema>;
