import type { Metadata } from "next";

import { HomeNavEnhancement } from "@/components/marketing/home-nav-enhancement";
import { FeaturesPage } from "@/components/marketing/features-page";

export const metadata: Metadata = {
  title: "Features",
  description: "See how Hiretivo helps you find jobs, tailor application documents, and track your job search.",
};

export default function Page() {
  return <><FeaturesPage /><HomeNavEnhancement /></>;
}
