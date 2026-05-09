import Link from "next/link";
import { CircleAlert, CircleCheckBig, MailWarning } from "lucide-react";

import { Button } from "@/components/ui/button";

type VerificationStatus = "success" | "expired" | "invalid" | "missing-token";

interface VerifyEmailPageProps {
  searchParams?: {
    status?: string;
  };
}

const STATUS_CONTENT: Record<
  VerificationStatus,
  {
    title: string;
    description: string;
    icon: typeof CircleCheckBig;
    iconColorClassName: string;
  }
> = {
  success: {
    title: "Email verified",
    description:
      "Your account is ready. Return to your app browser and click Check again.",
    icon: CircleCheckBig,
    iconColorClassName: "text-brand-success",
  },
  expired: {
    title: "Verification link expired",
    description:
      "This link is no longer valid. Request a new verification email and use the latest link.",
    icon: MailWarning,
    iconColorClassName: "text-amber-500",
  },
  invalid: {
    title: "Verification link is invalid",
    description:
      "This link cannot be verified. Request a fresh verification email and try again.",
    icon: CircleAlert,
    iconColorClassName: "text-brand-danger",
  },
  "missing-token": {
    title: "Verification link is incomplete",
    description:
      "Open the full verification link from your email or request a new one.",
    icon: CircleAlert,
    iconColorClassName: "text-brand-danger",
  },
};

/*
 * VerifyEmailPage
 * Shows verification outcomes after token validation redirects from verify-email API.
 * Reads `status` search param and provides next-step guidance for each state.
 */
export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const rawStatus = searchParams?.status;
  const status: VerificationStatus =
    rawStatus === "success" ||
    rawStatus === "expired" ||
    rawStatus === "invalid" ||
    rawStatus === "missing-token"
      ? rawStatus
      : "invalid";

  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg rounded-xl border border-brand-border bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-brand-border bg-brand-surface">
          <Icon className={`h-6 w-6 ${content.iconColorClassName}`} aria-hidden />
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-brand-foreground">
          {content.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-brand-foreground-muted">
          {content.description}
        </p>
        <div className="mt-6">
          <Button asChild variant="primary" className="w-full">
            <Link href="/">Return to Hiretivo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
