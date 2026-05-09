"use client";

import { UserRole } from "@/constants/enums";

type AnalyticsEventName = "sign_up" | "login" | "apply_job";
type AnalyticsStage = "attempt" | "success";
type AnalyticsAuthMethod = "credentials" | "google";
type AnalyticsApplyType = "internal" | "external";
type AnalyticsEntrypoint = "modal" | "redirect";

type SignUpEventParams = {
  role: UserRole;
  auth_method: AnalyticsAuthMethod;
  stage?: AnalyticsStage;
};

type LoginEventParams = {
  role: UserRole;
  auth_method: AnalyticsAuthMethod;
  stage?: AnalyticsStage;
};

type ApplyJobEventParams = {
  apply_type: AnalyticsApplyType;
  stage?: AnalyticsStage;
  entrypoint?: AnalyticsEntrypoint;
};

type AnalyticsEventParamsMap = {
  sign_up: SignUpEventParams;
  login: LoginEventParams;
  apply_job: ApplyJobEventParams;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent<T extends AnalyticsEventName>(
  eventName: T,
  params: AnalyticsEventParamsMap[T],
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}
