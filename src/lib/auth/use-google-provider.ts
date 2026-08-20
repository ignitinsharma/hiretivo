"use client";

import * as React from "react";
import { getProviders } from "next-auth/react";

export type GoogleProviderStatus = "loading" | "available" | "unavailable";

export function useGoogleProvider(): GoogleProviderStatus {
  const [status, setStatus] = React.useState<GoogleProviderStatus>("loading");

  React.useEffect(() => {
    let isMounted = true;
    void getProviders().then((providers) => {
      if (!isMounted) return;
      setStatus(providers?.google ? "available" : "unavailable");
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return status;
}