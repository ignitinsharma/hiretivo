import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deploymentMode } from "@/lib/deployment-mode";
import { AuthFrame } from "../login/auth-frame";
import { HostedAuthForm } from "../login/hosted-auth-form";

export const metadata: Metadata = { title: 'Check your inbox', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (deploymentMode() !== "hosted") notFound();
  const params = await searchParams;
  return <AuthFrame title='Check your inbox' description='Open the verification link we sent you. Links expire after 24 hours. Check spam, or request a new email below.'><HostedAuthForm mode="resend" email={typeof params.email === "string" ? params.email : ""} token={typeof params.token === "string" ? params.token : ""} /></AuthFrame>;
}
