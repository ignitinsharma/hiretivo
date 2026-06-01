import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./pricing-client";
import { CurrencyCode } from "@/constants/enums";
import type { PricingCurrency } from "@/constants/pricing";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Pricing",
  description: "Pricing that scales with your hiring needs.",
  path: "/pricing",
});

function getCountryFromHeaders(headersList: Headers): string {
  return (
    headersList.get("x-vercel-ip-country") ??
    headersList.get("cf-ipcountry") ??
    headersList.get("cloudfront-viewer-country") ??
    headersList.get("x-country-code") ??
    headersList.get("x-geo-country") ??
    headersList.get("x-forwarded-country") ??
    "US"
  ).toUpperCase();
}

export default async function PricingPage() {
  const headersList = await headers();
  const country = getCountryFromHeaders(headersList);
  const currency: PricingCurrency = country === "IN" ? CurrencyCode.INR : CurrencyCode.USD;

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
