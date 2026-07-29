import { z } from "zod";
import { isValidState, isValidCity } from "@/modules/india-location";

const SkillNameSchema = z
  .string()
  .trim()
  .min(1, "Skill is required")
  .max(80, "Skill must be 80 characters or fewer");

const SkillIdSchema = z.string().trim().min(1, "Skill id is required");

export const SeekerSettingsSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    phone: z.string().min(5, "Phone must be at least 5 digits").max(20).optional().or(z.literal("")),
    headline: z.string().max(200).optional().or(z.literal("")),
    bio: z.string().max(1000).optional().or(z.literal("")),
    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(100, "City must be under 100 characters")
      .regex(/^[^,]+$/, "City name cannot contain commas")
      .optional()
      .or(z.literal("")),
    state: z.string().optional().or(z.literal("")),
    skillIds: z
      .array(SkillIdSchema)
      .max(30)
      .refine((skillIds) => new Set(skillIds).size === skillIds.length, {
        message: "Skill ids must be unique",
      })
      .optional(),
    skillNames: z.array(SkillNameSchema).max(30).optional(),
    websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    twitterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  })
  .refine(
    (data) => {
      const hasCity = !!data.city && isValidCity(data.city);
      const hasState = !!data.state && isValidState(data.state);
      if (hasCity && !hasState) return false;
      if (!hasCity && hasState) return false;
      return true;
    },
    {
      message: "Provide a valid city and state together, or omit both",
      path: ["city"],
    },
  );

export type SeekerSettingsInput = z.input<typeof SeekerSettingsSchema>;
