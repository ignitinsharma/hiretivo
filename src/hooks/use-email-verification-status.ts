"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const query = useQuery<EmailVerificationStatus>({
    queryKey: EMAIL_VERIFICATION_STATUS_QUERY_KEY,
    queryFn: authService.getEmailVerificationStatus,
    enabled: sessionStatus === "authenticated",
    refetchInterval: (queryData) =>
      queryData.state.data?.requiresVerification ? 15_000 : false,
  });

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    const onFocus = () => {
      void queryClient.invalidateQueries({
        queryKey: EMAIL_VERIFICATION_STATUS_QUERY_KEY,
      });
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient, sessionStatus]);

  useEffect(() => {
    if (!query.data?.isVerified) return;
    if (session?.user?.emailVerified) return;

    void update();
  }, [query.data?.isVerified, session?.user?.emailVerified, update]);

  return query;
}
