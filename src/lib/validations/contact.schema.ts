import { z } from "zod";
import { CONTACT_REQUEST_TYPE_VALUES } from "@/constants/enums";

export const ContactSupportSchema = z.object({
  type: z.enum(CONTACT_REQUEST_TYPE_VALUES),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(200),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  companyOrRole: z.string().trim().max(160).optional().or(z.literal("")),
  preferredTime: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(3000),
});

export type ContactSupportInput = z.infer<typeof ContactSupportSchema>;
