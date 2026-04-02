import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a verification link to your email address. Click the link to verify your account
            and access all features.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Link href="/api/auth/resend-verification" className="text-primary underline underline-offset-4">
            resend the verification email
          </Link>
          .
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
