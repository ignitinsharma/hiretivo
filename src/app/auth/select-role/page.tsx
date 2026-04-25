"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setUserRole } from "@/app/actions/auth/set-role";
import { UserRole } from "@/constants/enums";

export default function SelectRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (role: UserRole) => {
    setLoading(role);
    setError(null);
    try {
      const result = await setUserRole(role);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome to Hiretivo</h1>
          <p className="text-muted-foreground">Are you looking for work, or looking to hire?</p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleSelect(UserRole.SEEKER)}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2 text-base"
          >
            {loading === UserRole.SEEKER ? "Setting up..." : "I'm looking for work"}
          </Button>

          <Button
            onClick={() => handleSelect(UserRole.RECRUITER)}
            disabled={loading !== null}
            size="lg"
            className="h-24 flex-col gap-2 text-base"
          >
            {loading === UserRole.RECRUITER ? "Setting up..." : "I'm hiring"}
          </Button>
        </div>
      </div>
    </div>
  );
}
