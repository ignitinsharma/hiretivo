"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

interface SessionExpiredCleanerProps {
  loginPath: string;
}

/*
 * SessionExpiredCleaner
 * Headless client effect that clears a stale JWT cookie and redirects to login.
 * Auth.js v5 server-side signOut() cannot set cookies during a server render,
 * so the cookie clear happens here on the client. Renders nothing.
 * @param loginPath - role-appropriate login route to land on after sign-out
 */
export function SessionExpiredCleaner({ loginPath }: SessionExpiredCleanerProps) {
  useEffect(() => {
    void signOut({ callbackUrl: loginPath });
  }, [loginPath]);

  return null;
}
