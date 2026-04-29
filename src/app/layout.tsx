/* eslint-disable @next/next/no-page-custom-font */
import { ApplyJobModal } from "@/components/shared/ApplyJobModal";
import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/providers/query-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hiretivo | Find Remote Work That Fits Your Life",
  description:
    "Skills-based remote job portal connecting talented professionals with remote-first companies worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ReactQueryProvider>
          <AuthSessionProvider>
            {children}
            <ApplyJobModal />
            <Toaster />
          </AuthSessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
