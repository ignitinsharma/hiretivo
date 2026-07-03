import { z } from "zod";
import { OPTIMIZE_MODE_VALUES } from "@/constants/enums";

export const OptimizeModeSchema = z.object({
  optimizeMode: z.enum(OPTIMIZE_MODE_VALUES),
});

export type OptimizeModeInput = z.infer<typeof OptimizeModeSchema>;
