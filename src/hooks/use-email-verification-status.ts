"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  authService,
  type EmailVerificationStatus,
} from "@/services/auth.service";

export const EMAIL_VERIFICATION_STATUS_QUERY_KEY = [
  "email-verification-status",
] as const;

export function useEmailVerificationStatus() {
  const { data: session, status: sessionStatus, update } = useSession();
  const updateCalledRef = useRef(false);
  const query = useQuery<EmailVerificationStatus>({
    queryKey: EMAIL_VERIFICATION_STATUS_QUERY_KEY,
    queryFn: authService.getEmailVerificationStatus,
    enabled: sessionStatus === "authenticated",
    refetchInterval: (queryData) =>
      queryData.state.data?.requiresVerification ? 15_000 : false,
  });

  useEffect(() => {
    if (!query.data?.isVerified) return;
    if (session?.user?.emailVerified) return;
    if (sessionStatus === "loading") return;
    if (updateCalledRef.current) return;

    updateCalledRef.current = true;
    void update();
  }, [query.data?.isVerified, session?.user?.emailVerified, sessionStatus, update]);

  return query;
}
