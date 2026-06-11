"use client";

import {
  FileText,
  Github,
  Globe,
  Linkedin,
  type LucideIcon,
  Mail,
  Twitter,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ProfileLinkVariant } from "@/constants/enums";

type IconType = LucideIcon;

interface ProfileLinksProps {
  email?: string | null;
  resumeUrl?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  videoIntroUrl?: string | null;
  variant?: ProfileLinkVariant;
  className?: string;
}

interface LinkItem {
  key: string;
  label: string;
  Icon: IconType;
  href?: string;
  onClick?: () => void;
}

const BASE_CLASS =
  "inline-flex items-center justify-center rounded-lg transition-colors";

const VARIANT_CLASS: Record<ProfileLinkVariant, string> = {
  [ProfileLinkVariant.GHOST]:
    "h-8 w-8 text-brand-foreground-muted hover:text-brand-foreground",
  [ProfileLinkVariant.BORDERED]:
    "h-7 w-7 border border-brand-border bg-white text-brand-foreground-muted hover:border-brand-primary hover:text-brand-primary",
};

const ICON_CLASS: Record<ProfileLinkVariant, string> = {
  [ProfileLinkVariant.GHOST]: "h-4 w-4",
  [ProfileLinkVariant.BORDERED]: "h-3.5 w-3.5",
};

/*
 * ProfileLinks
 * Shared recruiter-facing icon row of a seeker's contact + profile links.
 * Renders, in order, only the links that exist: email (copies to clipboard),
 * resume, website, LinkedIn, GitHub, Twitter, and video intro.
 * @param email - clicking copies it to the clipboard
 * @param resumeUrl/websiteUrl/linkedinUrl/githubUrl/twitterUrl/videoIntroUrl - opened in a new tab
 * @param variant - GHOST (drawer) or BORDERED (talent dialog) styling
 */
export function ProfileLinks({
  email,
  resumeUrl,
  websiteUrl,
  linkedinUrl,
  githubUrl,
  twitterUrl,
  videoIntroUrl,
  variant = ProfileLinkVariant.GHOST,
  className,
}: ProfileLinksProps) {
  /* Copies the email to clipboard and shows a toast. */
  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied.");
    } catch {
      toast.error("Could not copy email.");
    }
  };

  const items: LinkItem[] = [];
  if (email)
    items.push({ key: "email", label: "Copy email", Icon: Mail, onClick: copyEmail });
  if (resumeUrl)
    items.push({ key: "resume", label: "View resume", Icon: FileText, href: resumeUrl });
  if (websiteUrl)
    items.push({ key: "website", label: "Website", Icon: Globe, href: websiteUrl });
  if (linkedinUrl)
    items.push({ key: "linkedin", label: "LinkedIn", Icon: Linkedin, href: linkedinUrl });
  if (githubUrl)
    items.push({ key: "github", label: "GitHub", Icon: Github, href: githubUrl });
  if (twitterUrl)
    items.push({ key: "twitter", label: "Twitter", Icon: Twitter, href: twitterUrl });
  if (videoIntroUrl)
    items.push({ key: "video", label: "Video intro", Icon: Video, href: videoIntroUrl });

  if (items.length === 0) return null;

  const itemClass = cn(BASE_CLASS, VARIANT_CLASS[variant]);
  const iconClass = ICON_CLASS[variant];

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {items.map(({ key, label, Icon, href, onClick }) =>
        href ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            title={label}
            aria-label={label}
            className={itemClass}
          >
            <Icon className={iconClass} />
          </a>
        ) : (
          <button
            key={key}
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={itemClass}
          >
            <Icon className={iconClass} />
          </button>
        ),
      )}
    </div>
  );
}
