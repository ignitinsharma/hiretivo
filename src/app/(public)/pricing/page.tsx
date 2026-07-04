import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./pricing-client";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Pricing",
  description: "AI-tailored resumes and cover letters, priced by credits. Free 8/mo, Pro 400/mo, Max 1000/mo.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main>
        <PricingClient />
      </main>
      <Footer />
    </div>
  );
}
