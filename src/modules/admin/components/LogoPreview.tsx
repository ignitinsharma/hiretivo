"use client";

import { useEffect, useState } from "react";

interface LogoPreviewProps {
  url: string;
  companyName: string;
  size?: number;
}

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

  if (!url || errored || isMixedContent) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-brand-surface text-brand-foreground font-semibold border border-brand-border"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
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
      width={size}
      height={size}
      className="rounded-lg object-contain border border-brand-border bg-white"
      onError={() => setErrored(true)}
    />
  );
}
