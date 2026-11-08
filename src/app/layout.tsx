/* eslint-disable @next/next/no-page-custom-font */
import { EmailVerificationModal } from "@/components/shared/EmailVerificationModal";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { FEATURES } from "@/lib/config";
import { ReactQueryProvider } from "@/providers/query-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hire Verified Indian Engineers for Your Startup | Hiretivo",
  description:
    "Curated marketplace of pre-verified Indian engineers for startups worldwide. Browse talent, see real skills, hire faster.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ReactQueryProvider>
          <AuthSessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              {children}
            </ThemeProvider>
            <EmailVerificationModal />
            <Toaster />
            {analyticsEnabled && measurementId ? (
              <Suspense fallback={null}>
                <GoogleAnalytics measurementId={measurementId} />
              </Suspense>
            ) : null}
          </AuthSessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
