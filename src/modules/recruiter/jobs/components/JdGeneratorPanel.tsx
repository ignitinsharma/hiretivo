"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, RefreshCw, Wand2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sanitizeHtml, stripHtml } from "@/lib/utils/html-sanitizer";

import {
  JdGeneratorSchema,
  type JdGeneratorInput,
} from "@/lib/validations/jd-generator.schema";
import { recruiterService } from "@/services/recruiter.service";

interface JdGeneratorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillTitle: string;
  prefillDescription: string;
  onGenerated: (jd: string) => void;
}

/*
 * JdGeneratorPanel
 * Renders the recruiter AI JD generation sheet with form inputs, preview,
 * regeneration, and explicit accept flow.
 * @param open - Whether the sheet is visible
 * @param onOpenChange - Sheet visibility callback
 * @param prefillTitle - Job title from the parent form
 * @param prefillDescription - Existing job description used as generation context
 * @param onGenerated - Receives the accepted generated JD HTML
 */
export function JdGeneratorPanel({
  open,
  onOpenChange,
  prefillTitle,
  prefillDescription,
  onGenerated,
}: JdGeneratorPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJd, setGeneratedJd] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const shortDescRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JdGeneratorInput>({
    resolver: zodResolver(JdGeneratorSchema),
    defaultValues: { title: "", shortDesc: "", vibe: "" },
  });

  const shortDescValue = watch("shortDesc");

  useEffect(() => {
    setValue("title", prefillTitle);
    setValue("shortDesc", stripHtml(prefillDescription));
    if (open) {
      setHasApplied(false);
    }
  }, [open, prefillTitle, prefillDescription, setValue]);

  /*
   * handleOpenChange
   * Intercepts sheet close — auto-applies a pending generated JD so the
   * recruiter never loses a generation by accidentally closing the panel.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && generatedJd && !hasApplied) {
      onGenerated(generatedJd);
      setHasApplied(true);
      toast.success("AI draft applied to description. Regenerate anytime.");
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    const el = shortDescRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(200, Math.min(el.scrollHeight, 400))}px`;
  }, [shortDescValue]);

  const generateDraft = async (
    data: JdGeneratorInput,
    isRegeneration: boolean,
  ) => {
    setIsGenerating(true);
    try {
      const jd = await recruiterService.generateJobDescription({
        ...data,
        isRegeneration,
      });
      setGeneratedJd(jd.trim());
    } catch (err) {
      // Surface server messages (e.g. daily free-limit / upgrade prompt) verbatim
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Failed to generate JD. Try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: JdGeneratorInput) => generateDraft(data, false);

  const handleRegenerate = () => {
    void handleSubmit((data) => generateDraft(data, true))();
  };

  const handleUseGeneratedJd = () => {
    if (!generatedJd) return;
    onGenerated(generatedJd);
    setHasApplied(true);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-160 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Generate Job Description</SheetTitle>
          <SheetDescription>
            Fill in the basics. Generate a draft, review it, then choose whether
            to use it.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="jd-title"
              className="text-sm font-semibold text-brand-foreground"
            >
              Job Title <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="jd-title"
              placeholder="e.g. Senior Software Engineer"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-brand-danger">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="jd-shortdesc"
              className="text-sm font-semibold text-brand-foreground"
            >
              What is this role about?{" "}
              <span className="text-brand-danger">*</span>
            </Label>
            <Textarea
              id="jd-shortdesc"
              placeholder="Example: Frontend Developer with 5 years of experience. Strong React, TypeScript, and Node.js skills. Owns dashboard UI, API integration, performance, and component quality."
              className="resize-none min-h-50 max-h-100 overflow-y-auto"
              {...(() => {
                const { ref: rhfRef, ...rhfRest } = register("shortDesc", {
                  onChange: () => {
                    const el = shortDescRef.current;
                    if (!el) return;
                    el.style.height = "auto";
                    el.style.height = `${Math.max(200, Math.min(el.scrollHeight, 400))}px`;
                  },
                });
                return {
                  ...rhfRest,
                  ref: (e: HTMLTextAreaElement | null) => {
                    if (typeof rhfRef === "function") rhfRef(e);
                    shortDescRef.current = e;
                  },
                };
              })()}
            />
            {errors.shortDesc && (
              <p className="text-xs text-brand-danger">
                {errors.shortDesc.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="jd-vibe"
              className="text-sm font-semibold text-brand-foreground"
            >
              Culture / vibe{" "}
              <span className="font-normal text-brand-foreground-secondary">
                (optional)
              </span>
            </Label>
            <Input
              id="jd-vibe"
              placeholder="e.g. Fast-paced startup, async-first, ownership culture..."
              {...register("vibe")}
            />
            {errors.vibe && (
              <p className="text-xs text-brand-danger">
                {errors.vibe.message}
              </p>
            )}
          </div>

          <p className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs leading-relaxed text-brand-foreground-muted">
            Each generate or regenerate action uses one AI JD credit on the free
            plan. Paid plans can generate without the daily free limit.
          </p>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isGenerating && !generatedJd}
            loadingText="Generating..."
            disabled={isGenerating}
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            Generate Preview
          </Button>

          {generatedJd && (
            <section className="space-y-4 rounded-xl border border-brand-border bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-brand-foreground">
                    Generated preview
                  </h3>
                  <p className="text-xs leading-relaxed text-brand-foreground-muted">
                    Review this draft before replacing the job description.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRegenerate}
                    loading={isGenerating}
                    loadingText="Regenerating..."
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Regenerate
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleUseGeneratedJd}
                    disabled={isGenerating}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Use this JD
                  </Button>
                </div>
              </div>
              <div
                className="prose prose-slate max-w-none rounded-lg border border-brand-border bg-brand-surface/40 p-4 text-sm"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(generatedJd),
                }}
              />
            </section>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
