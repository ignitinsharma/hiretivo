"use client";
/** Open the shared creation dialog without changing the current route. */
export function openApplication(input: { posting?: string; startup?: string } = {}) {
  window.dispatchEvent(new CustomEvent("hiretivo:open-application", { detail: input }));
}
