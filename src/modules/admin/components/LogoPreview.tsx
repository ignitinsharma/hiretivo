"use client";

import { useEffect, useState } from "react";

type LogoSize = 28 | 32 | 48 | 56;

interface LogoPreviewProps {
  url: string;
  companyName: string;
  size?: LogoSize;
}

const SIZE_CLASS: Record<LogoSize, string> = {
  28: "w-7 h-7 text-[11px]",
  32: "w-8 h-8 text-xs",
  48: "w-12 h-12 text-lg",
  56: "w-14 h-14 text-xl",
};

/*
 * LogoPreview
 * Renders a company logo from an arbitrary URL with error fallback.
 * On image load failure (404, non-image content, mixed-content block), shows a colored
 * placeholder with the company's initial letter. Used in admin form thumbnail + live preview.
 */
export function LogoPreview({ url, companyName, size = 48 }: LogoPreviewProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [url]);

  const initial = companyName.trim().charAt(0).toUpperCase() || "?";
  const isMixedContent =
    url.startsWith("http://") &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:";

  const sizeClass = SIZE_CLASS[size];

  if (!url || errored || isMixedContent) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-brand-surface text-brand-foreground font-semibold border border-brand-border ${sizeClass}`}
        aria-label={`${companyName} logo placeholder`}
      >
        {initial}
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={`${companyName} logo`}
      className={`rounded-lg object-contain border border-brand-border bg-white ${sizeClass}`}
      onError={() => setErrored(true)}
    />
  );
}
