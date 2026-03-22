import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./pricing-client";

export const metadata = {
  title: "Pricing | Hiretivo",
  description: "Pricing that scales with your hiring needs.",
};

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
