import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deploymentMode } from "@/lib/deployment-mode";
import { AuthFrame } from "../login/auth-frame";
import { HostedAuthForm } from "../login/hosted-auth-form";

export const metadata: Metadata = { title: 'Forgot your password?', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (deploymentMode() !== "hosted") notFound();
  const params = await searchParams;
  return <AuthFrame title='Forgot your password?' description='Enter the email you signed up with. We will send a link to reset your password.'><HostedAuthForm mode="forgot" email={typeof params.email === "string" ? params.email : ""} token={typeof params.token === "string" ? params.token : ""} /></AuthFrame>;
}
