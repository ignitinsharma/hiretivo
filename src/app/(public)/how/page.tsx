import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HowFinalCTASection } from "@/components/how/HowFinalCTASection";
import { HowHeroSection } from "@/components/how/HowHeroSection";
import { HowMatchingSection } from "@/components/how/HowMatchingSection";
import { HowProcessSection } from "@/components/how/HowProcessSection";
import { HowRecruiterCallout } from "@/components/how/HowRecruiterCallout";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "How It Works",
  description:
    "See how Hiretivo helps job seekers build verified profiles, understand match signals, and apply to better remote roles.",
  path: "/how",
});

/*
 * HowPage
 * Composes the seeker-first public product walkthrough for Hiretivo.
 */
export default function HowPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HowHeroSection />
        <HowMatchingSection />
        <HowProcessSection />
        <HowRecruiterCallout />
        <HowFinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
