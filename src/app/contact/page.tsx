"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCalApi } from "@calcom/embed-react";

import { ContactRequestType } from "@/constants/enums";
import {
  ContactSupportSchema,
  type ContactSupportInput,
} from "@/lib/validations/contact.schema";
import { cn } from "@/lib/utils";
import { contactService } from "@/services/contact.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CalApi = Awaited<ReturnType<typeof getCalApi>>;

interface ModeOption {
  type: ContactRequestType;
  label: string;
  description: string;
}

export default function ContactPage() {
  const calRef = useRef<CalApi | null>(null);

  const [mode, setMode] = useState<ContactRequestType>(
    ContactRequestType.CONTACT,
  );

  /* Initialize Cal.com API for the Book a call tab */
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "ignitinsharma" });
      cal("ui", { hideEventTypeDetails: false });
      calRef.current = cal;
    })();
  }, []);

  const MODE_OPTIONS: ModeOption[] = [
    {
      type: ContactRequestType.CONTACT,
      label: "Contact",
      description: "Send us a product, account, or support question.",
    },
    {
      type: ContactRequestType.BOOK_CALL,
      label: "Book a call",
      description: "Schedule a 30-min call with our team.",
    },
    {
      type: ContactRequestType.REPORT_BUG,
      label: "Report a bug",
      description: "Share an issue so we can investigate and fix it quickly.",
    },
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactSupportInput>({
    resolver: zodResolver(ContactSupportSchema),
    defaultValues: {
      type: ContactRequestType.CONTACT,
      name: "",
      email: "",
      subject: "",
      companyOrRole: "",
      preferredTime: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: contactService.submit,
    onSuccess: () => {
      toast.success("Thanks, we received your request.");
      reset({
        type: mode,
        name: "",
        email: "",
        subject: "",
        companyOrRole: "",
        preferredTime: "",
        message: "",
      });
    },
    onError: () => {
      toast.error("Could not send your request. Please try again.");
    },
  });

  const handleModeChange = (nextMode: ContactRequestType): void => {
    if (nextMode === ContactRequestType.BOOK_CALL) {
      calRef.current?.("modal", { calLink: "ignitinsharma/30min" });
      return;
    }
    setMode(nextMode);
    setValue("type", nextMode, { shouldValidate: true });
  };

  const onSubmit = (data: ContactSupportInput): void => {
    mutation.mutate({ ...data, type: mode });
  };

  const isBugReport = mode === ContactRequestType.REPORT_BUG;

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-8">
          <Button variant="primary" asChild>
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>

          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
              Contact & Support
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
              Tell us how we can help.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-foreground-muted">
              Reach the Hiretivo team for product questions, account support, or
              a quick call about hiring and job search workflows.
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-brand-foreground">
              What happens next
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
              We review every request and reply from the support inbox. For call
              requests, include your timezone or a few windows that work for
              you.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODE_OPTIONS.map((option) => {
              const isActive = option.type === mode;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleModeChange(option.type)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    isActive
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-border bg-white text-brand-foreground hover:bg-gray-50",
                  )}
                >
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-sm leading-relaxed",
                      isActive ? "text-white/80" : "text-brand-foreground-muted",
                    )}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <input type="hidden" {...register("type")} />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-[#0a0a0a]"
                >
                  Name
                </label>
                <Input
                  id="name"
                  className="mt-2"
                  placeholder="Your name"
                  {...register("name")}
                />
                {errors.name?.message && (
                  <p className={FIELD_ERROR_CLASS}>{errors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-[#0a0a0a]"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  className="mt-2"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email?.message && (
                  <p className={FIELD_ERROR_CLASS}>{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
                <label
                  htmlFor="subject"
                  className="text-sm font-medium text-[#0a0a0a]"
                >
                  Subject
                </label>
                <Input
                  id="subject"
                  className="mt-2"
                  placeholder={isBugReport ? "Short bug title" : "How can we help?"}
                  {...register("subject")}
                />
                {errors.subject?.message && (
                  <p className={FIELD_ERROR_CLASS}>{errors.subject.message}</p>
                )}
              </div>

            <div>
              <label
                htmlFor="message"
                className="text-sm font-medium text-[#0a0a0a]"
              >
                Message
              </label>
              <Textarea
                id="message"
                className="mt-2 min-h-36"
                placeholder={
                  isBugReport
                    ? "Describe what happened, what you expected, and where it happened."
                    : "Share the details of your question or issue."
                }
                {...register("message")}
              />
              {errors.message?.message && (
                <p className={FIELD_ERROR_CLASS}>{errors.message.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={mutation.isPending}
              loadingText="Sending..."
              className="w-full sm:w-auto"
            >
              {isBugReport ? "Send bug report" : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

const FIELD_ERROR_CLASS = "mt-1 text-sm text-red-600";
