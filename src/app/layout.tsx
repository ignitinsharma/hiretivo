/* eslint-disable @next/next/no-page-custom-font */
import { ApplyJobModal } from "@/components/shared/ApplyJobModal";
import { EmailVerificationModal } from "@/components/shared/EmailVerificationModal";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { FEATURES } from "@/lib/config";
import { ReactQueryProvider } from "@/providers/query-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiretivo | Find Remote Work That Fits Your Life",
  description:
    "Skills-based remote job portal connecting talented professionals with remote-first companies worldwide.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const analyticsEnabled = FEATURES.ANALYTICS && !!measurementId;

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${bricolage.variable} ${dmSans.variable} font-body antialiased`}>
        <ReactQueryProvider>
          <AuthSessionProvider>
            {children}
            <ApplyJobModal />
            <EmailVerificationModal />
            <Toaster />
            {analyticsEnabled && measurementId ? (
              <GoogleAnalytics measurementId={measurementId} />
            ) : null}
          </AuthSessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
