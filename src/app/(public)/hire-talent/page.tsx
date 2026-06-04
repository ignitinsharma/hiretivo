import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  HireTalentFinalCTA,
  HireTalentHero,
  HireTalentHowItWorks,
  HireTalentPlansSnapshot,
  HireTalentPreview,
  HireTalentWhyDifferent,
} from "@/components/hire-talent";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Hire Verified Indian Engineers",
  description:
    "Browse verified Indian engineers with Hiretivo scores, salary transparency, and profile unlocks for serious recruiter outreach.",
  path: "/hire-talent",
});

export default function HireTalentPage() {
  return (
    <>
      <Header publicAudience="recruiter" />
      <main className="overflow-x-hidden" data-purpose="hire-talent-page">
        <HireTalentHero />
        <HireTalentWhyDifferent />
        <HireTalentHowItWorks />
        <HireTalentPreview />
        <HireTalentPlansSnapshot />
        <HireTalentFinalCTA />
      </main>
      <Footer />
    </>
  );
}
