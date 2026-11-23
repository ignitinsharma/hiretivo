import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { deploymentMode } from "@/lib/deployment-mode";

import AppLayout from "./(app)/layout";
import DashboardPage from "./(app)/dashboard/page";

export default async function IndexPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (deploymentMode() === "hosted") {
    redirect(await getSession() ? "/dashboard" : "/login");
  }
  return <AppLayout><DashboardPage {...props} /></AppLayout>;
}
