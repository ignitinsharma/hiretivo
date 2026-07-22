import { z } from "zod";

export const ApplyFromLinkSchema = z.object({
  url: z.string().trim().url().max(2048),
  pastedText: z.string().trim().max(20000).optional(),
  previewOnly: z.boolean().optional().default(false),
});

export type ApplyFromLinkInput = z.infer<typeof ApplyFromLinkSchema>;

export const ApplyFromTextSchema = z.object({
  title: z.string().trim().max(200).optional().default(""),
  company: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().min(1).max(20000),
  previewOnly: z.boolean().optional().default(false),
});

export type ApplyFromTextInput = z.infer<typeof ApplyFromTextSchema>;

export interface JobPreview {
  title: string;
  company: string;
  description: string;
  skills: string[];
}
