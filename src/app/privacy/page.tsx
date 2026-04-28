import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Privacy Policy",
  description: "Privacy Policy for Hiretivo platform.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg mb-6">
            <strong>Last updated:</strong> April 12, 2026
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            1. Information We Collect
          </h2>
          <p className="text-slate-600 mb-4">
            We collect information you provide directly, such as your name, email address, profile information, job preferences, and application data. We also collect usage data and analytics to improve our service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="text-slate-600 mb-4">
            We use your information to: (a) provide and improve the Platform; (b) match job seekers with relevant opportunities; (c) send notifications and communications; (d) analyze usage and trends.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            3. Information Sharing
          </h2>
          <p className="text-slate-600 mb-4">
            We do not sell your personal information. We may share information with recruiters as part of the application process, with service providers who assist in operating the Platform, or as required by law.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            4. Data Security
          </h2>
          <p className="text-slate-600 mb-4">
            We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            5. Your Rights
          </h2>
          <p className="text-slate-600 mb-4">
            You have the right to access, correct, or delete your personal information. Contact us at privacy@hiretivo.com to exercise these rights.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            6. Cookies
          </h2>
          <p className="text-slate-600 mb-4">
            We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
            7. Contact
          </h2>
          <p className="text-slate-600">
            For questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:privacy@hiretivo.com" className="text-black hover:underline">
              privacy@hiretivo.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
