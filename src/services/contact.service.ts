import { apiClient } from "@/lib/axios";
import type { ContactSupportInput } from "@/lib/validations/contact.schema";

export const contactService = {
  async submit(payload: ContactSupportInput): Promise<void> {
    await apiClient.post("/contact", payload);
  },
};
