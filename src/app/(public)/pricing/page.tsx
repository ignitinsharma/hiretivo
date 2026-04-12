import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./pricing-client";
import type { PricingCurrency } from "@/constants/pricing";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Pricing",
  description: "Pricing that scales with your hiring needs.",
  path: "/pricing",
});

export default async function PricingPage() {
  const headersList = await headers();
  const country = headersList.get("CF-IPCountry") ?? headersList.get("x-vercel-ip-country") ?? "US";
  const currency: PricingCurrency = country === "IN" ? "INR" : "USD";

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main>
        <PricingClient currency={currency} />
      </main>
      <Footer />
    </div>
  );
}
