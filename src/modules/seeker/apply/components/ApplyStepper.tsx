import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep } from "@/constants/enums";

interface ApplyStepperProps {
  step: WizardStep;
}

interface StepConfig {
  key: WizardStep;
  label: string;
}

const STEPS: StepConfig[] = [
  { key: WizardStep.OPTIMIZE, label: "Optimize resume" },
  { key: WizardStep.COVER, label: "Cover letter" },
  { key: WizardStep.SUBMIT, label: "Submit" },
  { key: WizardStep.DONE, label: "Done" },
];

/*
 * ApplyStepper
 * Data-driven step indicator for the apply wizard (Optimize -> Cover ->
 * Submit -> Done). Vertical on mobile, horizontal from `lg:` up.
 * @param step - the wizard's current WizardStep
 */
export function ApplyStepper({ step }: ApplyStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <ol className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-0">
      {STEPS.map((s, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;
        return (
          <li key={s.key} className="flex items-center gap-3 lg:flex-1">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold",
                isComplete && "border-brand-primary bg-brand-primary text-brand-primary-foreground",
                isActive && "border-brand-primary text-brand-primary",
                !isComplete && !isActive && "border-brand-border text-brand-foreground-secondary",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isComplete ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isActive || isComplete ? "text-brand-foreground" : "text-brand-foreground-secondary",
              )}
            >
              {s.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden h-px flex-1 bg-brand-border lg:mx-4 lg:block" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
