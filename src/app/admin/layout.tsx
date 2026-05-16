import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin/is-admin";
import { AdminShell } from "@/modules/admin/components/AdminShell";

/*
 * /admin layout
 * Server-side admin guard layered on top of middleware. Defense in depth.
 * Wraps every /admin page with the shared AdminShell chrome.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isAdminSession(session)) {
    redirect("/auth/recruiter/login?next=/admin/verification");
  }
  return <AdminShell>{children}</AdminShell>;
}
