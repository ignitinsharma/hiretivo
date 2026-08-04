import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./pricing-client";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Pricing",
  description: "Start free. Upgrade when your search heats up. AI resume tailoring for every job.",
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
