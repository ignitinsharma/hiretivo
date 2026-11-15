import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deploymentMode } from "@/lib/deployment-mode";
import { AuthFrame } from "../login/auth-frame";
import { HostedAuthForm } from "../login/hosted-auth-form";

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (deploymentMode() !== "hosted") notFound();
  const params = await searchParams;
  return <AuthFrame title='Choose a new password' description='Your reset link works once and expires after 30 minutes.'><HostedAuthForm mode="reset" email={typeof params.email === "string" ? params.email : ""} token={typeof params.token === "string" ? params.token : ""} /></AuthFrame>;
}
