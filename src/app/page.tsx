import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ThreePillarsSection } from "@/components/home/ThreePillarsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { HomeCtaSection } from "@/components/home/HomeCtaSection";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";

const SHOW_COMING_SOON = process.env.NEXT_PUBLIC_SHOW_COMING_SOON === "true";

export const metadata = generatePageMetadata({
  title: "Hire Verified Indian Engineers | Hiretivo",
  description:
    "Browse pre-vetted Indian engineers for US/EU startups. Hiretivo Score, real USD salary expectations, and 4-8h live overlap.",
});

/*
 * Home
 * Renders the public Hiretivo homepage for signed-out visitors.
 * Talent marketplace positioning with Hero, Three Pillars, How It Works, and CTA sections.
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
        <ThreePillarsSection />
        <HowItWorksSection />
        <HomeCtaSection />
      </main>
      <Footer />
    </>
  );
}
