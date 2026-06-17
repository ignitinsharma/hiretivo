import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroRecruiterSection } from "@/components/home/HeroRecruiterSection";
import { StatsBarSection } from "@/components/home/StatsBarSection";
import { FeaturedEngineersSection } from "@/components/home/FeaturedEngineersSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { AiFeaturesSection } from "@/components/home/AiFeaturesSection";
import { WhyVerifiedSection } from "@/components/home/WhyVerifiedSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { EngineerCTASection } from "@/components/home/EngineerCTASection";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";

const SHOW_COMING_SOON = process.env.NEXT_PUBLIC_SHOW_COMING_SOON === "true";

export const metadata = generatePageMetadata({
  title: "Hire verified Indian engineers for your startup.",
  description:
    "Every engineer is manually reviewed, proof-checked, and salary-transparent. Browse the verified talent pool and hire in 7 days.",
});

/*
 * Home
 * Public homepage for Hiretivo — verified Indian engineer marketplace.
 * Recruiter-first: dark hero with blurred engineer cards, inline stats,
 * how-it-works, why-verified pillars, and an engineer CTA band.
 * Authenticated users redirect to their dashboard immediately.
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
      <main className="overflow-x-hidden">
        <HeroRecruiterSection />
        <StatsBarSection />
        <FeaturedEngineersSection />
        <HowItWorksSection />
        <AiFeaturesSection />
        <WhyVerifiedSection />
        <TestimonialsSection />
        <EngineerCTASection />
      </main>
      <Footer />
    </>
  );
}
