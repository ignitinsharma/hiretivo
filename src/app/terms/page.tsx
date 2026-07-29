import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Terms of Service",
  description: "Terms of Service for Hiretivo platform.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-foreground mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-brand-foreground-muted text-lg mb-6">
            <strong>Last updated:</strong> April 12, 2026
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="text-brand-foreground-muted mb-4">
            By accessing or using Hiretivo (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            2. Description of Service
          </h2>
          <p className="text-brand-foreground-muted mb-4">
            Hiretivo is a skills-based remote job portal that connects job seekers with recruiters. The Platform provides job matching, application management, and communication tools.
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            3. User Accounts
          </h2>
          <p className="text-brand-foreground-muted mb-4">
            You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            4. Prohibited Conduct
          </h2>
          <p className="text-brand-foreground-muted mb-4">
            You may not use the Platform to: (a) post fraudulent or misleading job listings; (b) harass or discriminate against other users; (c) scrape or collect data without authorization; (d) violate any applicable laws or regulations.
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            5. Intellectual Property
          </h2>
          <p className="text-brand-foreground-muted mb-4">
            All content, trademarks, and data on the Platform are the property of Hiretivo or its licensors. Unauthorized use is prohibited.
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            6. Limitation of Liability
          </h2>
          <p className="text-brand-foreground-muted mb-4">
            Hiretivo is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages.
          </p>

          <h2 className="text-2xl font-bold text-brand-foreground mt-8 mb-4">
            7. Contact
          </h2>
          <p className="text-brand-foreground-muted">
            For questions about these Terms, contact us at{" "}
            <a href="mailto:legal@hiretivo.com" className="text-brand-foreground hover:underline">
              legal@hiretivo.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
