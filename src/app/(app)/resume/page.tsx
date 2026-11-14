import type { Metadata } from "next";

import { loadProfile } from "@/lib/profile-data";
import { maxPages } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-data";
import { loadThemes, loadThemeUsage } from "@/lib/theme-data";

import { ProfileEditor } from "../profile/profile-editor";
import { sectionFromParam } from "../profile/sections";
import { ResumeWorkspace } from "./resume-workspace";

export const metadata: Metadata = { title: "Resume" };

/** The base resume: a live preview of the profile in the chosen theme (RES-1). */
export default async function BaseResumePage({ searchParams }: PageProps<"/resume">) {
  const [{ panel, tab, section, imported }, profile, settings] = await Promise.all([searchParams, loadProfile(), loadSettings()]);
  if (tab === "profile") return <ProfileEditor key={typeof imported === "string" ? imported : "profile"} initial={profile} section={sectionFromParam(section, profile.customSections)} order={{ experience: settings.experienceOrder, projects: settings.projectOrder, education: settings.educationOrder, skills: settings.skillOrder }} sections={settings.resumeSections} />;
  const [themes, usage] = await Promise.all([loadThemes(), loadThemeUsage()]);
  return (
    <ResumeWorkspace
      profile={profile}
      themes={themes}
      usage={usage}
      baseThemeId={settings.baseThemeId}
      paper={settings.paper}
      includeReferences={settings.includeRefs}
      language={settings.resumeLanguage}
      maxPages={maxPages(settings.pageLimit)}
      sections={settings.resumeSections}
      fitToPage={settings.fitBaseResume}
      initialPanel={panel === "sections" ? "sections" : "themes"}
    />
  );
}
