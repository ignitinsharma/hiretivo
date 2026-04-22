'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { JdGeneratorSchema, type JdGeneratorInput } from '@/lib/validations/jd-generator.schema';

interface JdGeneratorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillTitle: string;
  onGenerated: (jd: string) => void;
}

export function JdGeneratorPanel({ open, onOpenChange, prefillTitle, onGenerated }: JdGeneratorPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JdGeneratorInput>({
    resolver: zodResolver(JdGeneratorSchema),
    defaultValues: { title: '', shortDesc: '', vibe: '' },
  });

  useEffect(() => {
    setValue('title', prefillTitle);
  }, [prefillTitle, setValue]);

  const onSubmit = async (data: JdGeneratorInput) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/recruiter/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        toast.error('Failed to generate JD. Try again.');
        return;
      }

      // Consume the streaming response — build the JD text incrementally
      const reader = res.body?.getReader();
      if (!reader) {
        toast.error('Failed to read response stream.');
        return;
      }

      const decoder = new TextDecoder();
      let jd = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        jd += decoder.decode(value, { stream: true });
      }

      // Final flush
      jd += decoder.decode();

      onGenerated(jd.trim());
      onOpenChange(false);
    } catch {
      toast.error('Failed to generate JD. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generate Job Description</SheetTitle>
          <SheetDescription>Fill in the basics — AI will write the full JD.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="jd-title" className="text-sm font-semibold text-slate-700">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="jd-title"
              placeholder="e.g. Senior Software Engineer"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd-shortdesc" className="text-sm font-semibold text-slate-700">
              What is this role about? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="jd-shortdesc"
              placeholder="Describe the core responsibilities and goals of this role (min 50 chars)..."
              className="resize-none min-h-[100px]"
              {...register('shortDesc')}
            />
            {errors.shortDesc && (
              <p className="text-xs text-red-500">{errors.shortDesc.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd-vibe" className="text-sm font-semibold text-slate-700">
              Culture / vibe <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="jd-vibe"
              placeholder="e.g. Fast-paced startup, async-first, ownership culture..."
              {...register('vibe')}
            />
            {errors.vibe && (
              <p className="text-xs text-red-500">{errors.vibe.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-bold"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Job Description'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
