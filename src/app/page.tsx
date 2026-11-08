import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ResumeEngineSection } from "@/components/home/ResumeEngineSection";
import { JobDashboardSection } from "@/components/home/JobDashboardSection";
import { KanbanTrackerSection } from "@/components/home/KanbanTrackerSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { AutoApplyTeaser } from "@/components/home/AutoApplyTeaser";
import { SeekerCTASection } from "@/components/home/SeekerCTASection";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { generatePageMetadata } from "@/lib/metadata";

const SHOW_COMING_SOON = process.env.NEXT_PUBLIC_SHOW_COMING_SOON === "true";

export const metadata = generatePageMetadata({
  title: "Stop copy-pasting. Start landing. | Hiretivo",
  description:
    "Paste any job link and get a tailored, ATS-ready resume in seconds. Browse jobs, generate AI resumes, apply, and track everything in one place.",
});

/*
 * Home
 * Public homepage for Hiretivo — seeker-first landing page.
 * 6 sections: Hero (centered), How It Works (3-step), Resume Engine showcase,
 * Job Dashboard showcase, Features (3 cards), CTA (free sign-up).
 * Authenticated users redirect to their dashboard immediately.
 */
export default async function Home() {
  if (SHOW_COMING_SOON) {
    return <ComingSoonPage />;
  }

  const session = await auth();
  if (session?.user) {
    if (process.env.NEXT_PUBLIC_SELF_HOSTED !== "true" && session.user.onboardingCompleted === false) {
      redirect("/seeker/onboarding");
    }
    redirect("/dashboard");
  }

  return (
    <>
      <Header />
      <main className="overflow-x-hidden">
        <HeroSection />
        <HowItWorksSection />
        <JobDashboardSection />
        <ResumeEngineSection />
        <KanbanTrackerSection />
        <FeaturesSection />
        <AutoApplyTeaser />
        <SeekerCTASection />
      </main>
      <Footer />
    </>
  );
}
