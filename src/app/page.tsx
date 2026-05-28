import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { AIMatchmakingSection } from "@/components/home/AIMatchmakingSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedJobsSection } from "@/components/home/FeaturedJobsSection";
// import { CategoriesSection } from "@/components/home/CategoriesSection";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
import { FindYourPeopleSection } from "@/components/shared/FindYourPeopleSection";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";

const SHOW_COMING_SOON = process.env.NEXT_PUBLIC_SHOW_COMING_SOON === "true";

export const metadata = generatePageMetadata({
  title: "Skills-Based Remote Job Portal",
  description:
    "Find remote jobs matched to your skills. No resume black holes — just skill-based matching for developers, designers, and more.",
});

/*
 * Home
 * Renders the public Hiretivo homepage for signed-out visitors.
 * Stats values are hardcoded placeholders pending real data.
 */
export default async function Home() {
  if (SHOW_COMING_SOON) {
    return <ComingSoonPage />;
  }

  const session = await auth();
  if (session?.user) {
    if (session.user.onboardingCompleted === false) {
      redirect(
        session.user.role === UserRole.RECRUITER
          ? "/recruiter/onboarding"
          : "/seeker/onboarding",
      );
    }
    redirect(
      session.user.role === UserRole.RECRUITER
        ? "/recruiter/dashboard"
        : "/seeker/dashboard",
    );
  }

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <AIMatchmakingSection />
        <StatsBar />
        <FeaturedJobsSection />
        <FindYourPeopleSection
          clientCount="0"
          candidateCount="0"
          className="bg-brand-surface px-4 py-20 md:px-8"
        />
        {/* <CategoriesSection activeJobs={HOMEPAGE_DISPLAY_STATS.activeJobs} /> */}
      </main>
      <Footer />
    </>
  );
}
