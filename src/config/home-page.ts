import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Palette,
  PackageCheck,
  Megaphone,
  TrendingUp,
  Headphones,
} from "lucide-react";

export const HOMEPAGE_DISPLAY_STATS = {
  heroRemoteJobs: "300+",
  activeJobs: "300+",
  companiesHiring: "120+",
  jobSeekers: "10k+",
} as const;

export interface CategoryShowcaseItem {
  title: string;
  count: string;
  roles: string;
  salary: string;
  skills: string[];
  icon: LucideIcon;
}

export const CATEGORY_SHOWCASE: CategoryShowcaseItem[] = [
  {
    title: "Engineering",
    count: "1,240 roles",
    roles: "Frontend, Backend, Full-stack",
    salary: "$120k - $210k",
    skills: ["React", "Node.js", "AI"],
    icon: Code2,
  },
  {
    title: "Design",
    count: "450 roles",
    roles: "Product, Brand, UX systems",
    salary: "$90k - $165k",
    skills: ["Figma", "UX", "SaaS"],
    icon: Palette,
  },
  {
    title: "Product",
    count: "380 roles",
    roles: "Growth, Platform, AI products",
    salary: "$130k - $220k",
    skills: ["Roadmaps", "Data", "Remote"],
    icon: PackageCheck,
  },
  {
    title: "Marketing",
    count: "320 roles",
    roles: "Lifecycle, SEO, Demand gen",
    salary: "$85k - $150k",
    skills: ["SEO", "CRM", "B2B"],
    icon: Megaphone,
  },
  {
    title: "Sales",
    count: "215 roles",
    roles: "AE, SDR, Partnerships",
    salary: "$100k - $180k",
    skills: ["Pipeline", "SaaS", "Outbound"],
    icon: TrendingUp,
  },
  {
    title: "Customer Support",
    count: "190 roles",
    roles: "Success, Support, Operations",
    salary: "$70k - $130k",
    skills: ["CS", "Ops", "Async"],
    icon: Headphones,
  },
];