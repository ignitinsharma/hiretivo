"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  authService,
  type EmailVerificationStatus,
} from "@/services/auth.service";

export const EMAIL_VERIFICATION_STATUS_QUERY_KEY = [
  "email-verification-status",
] as const;

/*
 * Module-level flag — survives component unmount/remount within one browser session.
 * Resets only on hard reload (new JS bundle). By then, session.user.emailVerified
 * is already a Date in the JWT, so the guard on line 2 of the effect catches it.
 *
 * EDGE CASES:
 * - Unverified user:        isVerified=false → guard 1 fires → flag never set → works ✓
 * - User verifies mid-session: query refetches (15s) → isVerified flips true →
 *   emailVerified not in JWT yet → flag is false → update() fires once → JWT syncs ✓
 * - Navigate away + back:   flag=true → guard 4 fires → no duplicate update() ✓
 * - Hard reload after verify: flag resets but session.user.emailVerified is a Date →
 *   guard 2 fires → no update() needed ✓
 * - Multiple tabs:          each tab has own module instance → independent flags ✓
 */
let _sessionRefreshDone = false;

export function useEmailVerificationStatus() {
  const { data: session, status: sessionStatus, update } = useSession();

  const query = useQuery<EmailVerificationStatus>({
    queryKey: EMAIL_VERIFICATION_STATUS_QUERY_KEY,
    queryFn: authService.getEmailVerificationStatus,
    enabled: sessionStatus === "authenticated",
    staleTime: 5 * 60_000,
    refetchInterval: (queryData) =>
      queryData.state.data?.requiresVerification ? 15_000 : false,
  });

  useEffect(() => {
    // Guard 1: email not yet verified in DB — nothing to sync
    if (!query.data?.isVerified) return;
    // Guard 2: JWT already has emailVerified — session is in sync, skip
    if (session?.user?.emailVerified) return;
    // Guard 3: session still hydrating — wait
    if (sessionStatus === "loading") return;
    // Guard 4: already called update() this browser session — prevent remount loop
    if (_sessionRefreshDone) return;

    _sessionRefreshDone = true;
    void update();
  }, [query.data?.isVerified, session?.user?.emailVerified, sessionStatus, update]);

  return query;
}
