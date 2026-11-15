import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deploymentMode } from "@/lib/deployment-mode";
import { AuthFrame } from "../login/auth-frame";
import { HostedAuthForm } from "../login/hosted-auth-form";

export const metadata: Metadata = { title: 'Verify your email', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (deploymentMode() !== "hosted") notFound();
  const params = await searchParams;
  return <AuthFrame title='Verify your email' description='Confirm your email address to start using Hiretivo.'><HostedAuthForm mode="verify" email={typeof params.email === "string" ? params.email : ""} token={typeof params.token === "string" ? params.token : ""} /></AuthFrame>;
}
