import { z } from "zod"
import { WorkType } from "@/constants/enums"

/*
 * ParsedFiltersSchema
 * Shape of LLM-parsed filters from an AI talent search query.
 * Used when chip removal triggers a re-search to skip the parse step.
 */
export const ParsedFiltersSchema = z.object({
  skills: z.array(z.string()).optional(),
  minYears: z.number().int().nonnegative().optional(),
  maxYears: z.number().int().nonnegative().optional(),
  role: z.string().optional(),
  workPreference: z.nativeEnum(WorkType).optional(),
  location: z.string().optional(),
  availability: z.string().optional(),
  keywords: z.array(z.string()).optional(),
})

export type ParsedFilters = z.infer<typeof ParsedFiltersSchema>

/*
 * AiSearchSchema
 * Validates the POST body for the AI talent search endpoint.
 * query: natural language input from the recruiter.
 * parsedFilters: if present, the parse step is skipped and these filters are used directly.
 * page: page number (MVP always 1, included for future use).
 */
export const AiSearchSchema = z.object({
  query: z.string().min(1).max(300),
  parsedFilters: ParsedFiltersSchema.optional(),
  page: z.number().int().positive().optional().default(1),
})

export type AiSearchInput = z.infer<typeof AiSearchSchema>
