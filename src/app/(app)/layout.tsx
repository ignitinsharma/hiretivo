import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { isDesktopApp } from "@/lib/desktop";
import { loadProfileName } from "@/lib/profile-data";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings-data";
import { opensSetupGuide } from "@/lib/setup-guide";
import { parseSidebarCollapsed, SIDEBAR_COOKIE } from "@/lib/ui-preferences";
import { rememberBrowserTimeZone, userTimeZone } from "@/lib/time-zone";
import { appVersion } from "@/lib/version";

import { ImportResumeModal } from "./profile/import/import-modal";
import { ApplicationModal } from "./new/application-modal";
import { Sidebar } from "./sidebar";

/**
 * The signed-in shell: sidebar on the left, the screen on the right. Routes
 * outside the (app) group, such as /login, render without it. Every page
 * inside needs a session.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  // Proxy already redirects signed-out visitors; this is the check next to the data.
  await verifySession();
  // The browser's zone, for anything that runs without a request.
  const zone = await userTimeZone();
  after(() => rememberBrowserTimeZone(zone));

  const [name, settings, jar] = await Promise.all([loadProfileName(), loadSettings(), cookies()]);
  // A fresh install starts with the setup guide, once (E21).
  if (settings.setupGuide === null && opensSetupGuide({ guide: null, name, applications: await prisma.application.count() })) redirect("/welcome");
  const userName = name.trim() || "New user";

  return (
    <div data-hiretivo-app className="flex min-h-screen">
      <a
        href="#main"
        className="fixed top-3 left-3 z-50 -translate-y-[200%] rounded-control bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:text-on-primary focus:translate-y-0"
      >
        Skip to content
      </a>
      <ApplicationModal />
      <ImportResumeModal />
      <Sidebar
        userName={userName}
        currentVersion={appVersion}
        desktop={isDesktopApp()}
        collapsed={parseSidebarCollapsed(jar.get(SIDEBAR_COOKIE)?.value)}
      />
      {/* The screen sits in a panel inset from the shell. Each screen
          starts with its page bar (PageHeader or PageBar), which draws the
          panel's top edge and stays in view. */}
      <div className="flex min-w-0 flex-1 flex-col bg-paper px-2 pb-2">
        <main
          id="main"
          tabIndex={-1}
          className="relative flex min-w-0 flex-1 flex-col rounded-b-panel border border-t-0 border-line-card bg-surface focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
