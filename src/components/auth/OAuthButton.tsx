"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OAuthButtonProps {
  provider: "google" | "github";
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

const providerConfig = {
  google: {
    label: "Google",
    iconPath: "M17.6431 10.3069C17.6431 9.48043 17.5729 8.65395 17.4326 7.84748H9.13158V11.3395H14.1069C14.0037 12.5507 13.4874 13.6733 12.6648 14.5128V17.1194H15.6874C17.2254 15.5141 18.4286 13.2189 18.4286 10.3069C18.4286 10.1363 18.4186 9.96979 18.4046 9.80325",
  },
  github: {
    label: "GitHub",
    iconPath: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z",
  },
};

export function OAuthButton({
  provider,
  onClick,
  isLoading,
  className,
}: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full gap-2", className)}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill={provider === "github" ? "currentColor" : "none"}
          xmlns="http://www.w3.org/2000/svg"
        >
          {provider === "google" && (
            <path
              d={config.iconPath}
              fill="#4285F4"
            />
          )}
          {provider === "google" && (
            <path
              d="M21.7785 12.2569C21.7785 11.7159 21.7384 11.1849 21.6583 10.6639H12V15.3169H17.1583C16.9483 16.4569 16.3183 17.4169 15.3583 18.1069V21.1369H18.6583C20.8783 19.0069 21.7785 16.1269 21.7785 12.2569Z"
              fill="#4285F4"
            />
          )}
          {provider === "google" && (
            <path
              d="M12 21.997C15.312 21.997 18.118 20.687 19.9183 18.1379L15.3583 14.7569C14.4583 15.4269 13.3083 15.8479 12 15.8479C8.648 15.8479 5.812 13.5879 4.9783 10.3669H1.2283V13.9169C3.1183 18.1369 7.308 21.997 12 21.997Z"
              fill="#34A853"
            />
          )}
          {provider === "google" && (
            <path
              d="M4.9783 10.3669C4.7083 9.41691 4.7083 8.41691 4.9783 7.46691L1.2283 7.47691L1.2283 7.47691C0.408333 9.15691 0.048334 10.997 0.048334 12.927C0.048334 14.857 0.408333 16.697 1.2283 18.3779L4.9783 10.3669Z"
              fill="#FBBC05"
            />
          )}
          {provider === "google" && (
            <path
              d="M12 5.15391C13.908 5.15391 15.618 5.87391 16.928 7.17391L19.998 4.10391C18.118 2.24391 15.312 0.99707 12 0.99707C7.308 0.99707 3.118 4.85791 1.2283 9.07691L4.9783 10.3669C5.812 7.15391 8.648 4.88691 12 4.88691V5.15391H12Z"
              fill="#EA4335"
            />
          )}
          {provider === "github" && (
            <path d={config.iconPath} />
          )}
        </svg>
      )}
      {config.label}
    </Button>
  );
}
