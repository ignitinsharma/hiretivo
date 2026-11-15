import type { Metadata } from "next";
import { connection } from "next/server";

import { Toaster } from "@/components/toast";
import { fontVariables } from "@/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Hiretivo", template: "%s · Hiretivo" },
  description: "Your profile, tailored resumes, and applications in one free workspace. Bring your own AI API keys.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page renders per request: its scripts carry that request's CSP nonce (E11-5).
  await connection();
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@variable&display=swap" />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
