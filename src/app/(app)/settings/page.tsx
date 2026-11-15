import type { Metadata } from "next";
import { headers } from "next/headers";

import { loadAiConfig, loadAiSettingsView } from "@/lib/ai/config";
import { jobSearchView, loadJobSearchConfig } from "@/lib/job-search/config";
import { COUNTRIES } from "@/lib/job-search/countries";
import { isDesktopApp } from "@/lib/desktop";
import { loadSearch } from "@/lib/posting-searches";
import { providerOption } from "@/lib/ai/provider-options";
import { lastNightlyBackup } from "@/lib/backup-schedule";
import { backupsDir } from "@/lib/backups";
import { mcpUrl } from "@/lib/connector/oauth";
import { exportFileName } from "@/lib/data-export";
import { isSqliteUrl } from "@/lib/database";
import { deploymentMode } from "@/lib/deployment-mode";
import { env } from "@/lib/env";
import { redirectUri } from "@/lib/google/oauth";
import { bridgeUrl } from "@/lib/google/bridge";
import { listWritableCalendars } from "@/lib/google/calendar";
import { googleClientView, googleView, requestOrigin, whenRan } from "@/lib/settings-views";
import { lastKnownTimeZone, userTimeZone } from "@/lib/time-zone";
import { appVersion } from "@/lib/version";
import { prisma } from "@/lib/prisma";
import { loadProfileName } from "@/lib/profile-data";
import { scoringProblem } from "@/lib/scoring";
import { loadScoringConfig, scoringView } from "@/lib/scoring/config";
import { loadSettings } from "@/lib/settings-data";

import { AgentSection } from "./agent-section";
import { AiBehaviour } from "./ai-behaviour";
import { AiProviderSection } from "./ai-provider-section";
import { AiFallbackSection } from "./ai-fallback-section";
import { loadFallbackSettingsView } from "./fallback-actions";
import { DataSection } from "./data-section";
import { DocumentsSection } from "./documents-section";
import { GoogleSection } from "./google-section";
import { GoogleNotice } from "./google-notice";
import { JobSearchSection } from "./job-search-section";
import { ScoringSection } from "./scoring-section";
import { AboutSection, type AboutFacts } from "./about-section";
import { ConnectorSection } from "./connector-section";
import { settingsSectionFromParam } from "./sections";
import { SettingsScreen } from "./settings-screen";

export const metadata: Metadata = { title: "Settings" };

/** Settings (PRD §6.8); the section is in `?section=` (E10-1). */
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const params = await searchParams;
  const section = settingsSectionFromParam(params.section);
  const hosted = deploymentMode() === "hosted";
  const settings = await loadSettings();

  return (
    <SettingsScreen section={section} hosted={hosted}>
      {section === "ai" ? (
        <>
          <AiProviderSection initial={await loadAiSettingsView()} />
          <AiFallbackSection key={`${settings.provider}:${settings.baseUrl}:${settings.model}`} initial={await loadFallbackSettingsView()} />
          <AiBehaviour initial={{ creativity: settings.creativity, strict: settings.strict, showDiff: settings.showDiff }} />
        </>
      ) : section === "jobs" ? (
        <JobSearchSection initial={jobSearchView(await loadJobSearchConfig())} />
      ) : section === "scoring" ? (
        <ScoringSection initial={scoringView(await loadScoringConfig())} />
      ) : section === "agent" ? (
        <AgentSection
          initial={{
            enabled: settings.agentEnabled,
            // With no search of its own yet, it starts from the last one in Find jobs.
            query: settings.agentQuery.keywords.trim() ? settings.agentQuery : ((await loadSearch())?.query ?? settings.agentQuery),
            hour: settings.agentHour,
            minScore: settings.agentMinScore,
            maxScores: settings.agentMaxScores,
            maxDrafts: settings.agentMaxDrafts,
            autoDraft: settings.agentAutoDraft,
          }}
          source={(await loadJobSearchConfig()).source}
          scoring={await scoringReadiness()}
          countries={COUNTRIES}
          timeZone={await lastKnownTimeZone()}
          onlyWhileOpen={isDesktopApp()}
        />
      ) : section === "google" ? (
        <>
          <GoogleNotice outcome={typeof params.google === "string" ? params.google : null} />
          <GoogleSection
            connection={await googleView()}
            client={await googleClientView()}
            browserTimeZone={(await userTimeZone()) ?? null}
            redirectUri={redirectUri(await requestOrigin())}
            bridgeAvailable={Boolean(bridgeUrl())}
            calendars={await calendarChoices()}
            initial={{
              calendarEvents: settings.calendarEvents,
              calendarId: settings.calendarId,
              workTimeZone: settings.workTimeZone,
              slotMinutes: settings.slotMinutes,
            }}
          />
        </>
      ) : section === "connector" ? (
        <ConnectorSection
          initial={{ on: settings.connectorEnabledAt !== null, redirects: settings.connectorRedirects }}
          address={mcpUrl(env.HIRETIVO_PUBLIC_URL ?? (await requestOrigin()))}
        />
      ) : section === "data" ? (
        <DataSection
          hosted={hosted}
          hasApiKey={[settings.apiKeyEnc, settings.jsearchKeyEnc, settings.adzunaKeyEnc].some((key) => key !== null)}
          exportName={exportFileName()}
          backups={{
            on: settings.nightlyBackup,
            retentionDays: env.HIRETIVO_BACKUP_RETENTION_DAYS,
            dir: await backupsDir(),
            lastRun: whenRan(await lastNightlyBackup()),
            problem: settings.backupProblem,
            onlyWhileOpen: isDesktopApp(),
          }}
          jobRetentionHours={settings.jobRetentionHours}
        />
      ) : section === "documents" ? (
        <DocumentsSection
          // Only these fields: the settings also hold the encrypted API key, which never leaves the server.
          initial={{
            paper: settings.paper,
            dateFormat: settings.dateFormat,
            defaultTone: settings.defaultTone,
            docLanguage: settings.docLanguage,
            resumeLanguage: settings.resumeLanguage,
            customLanguages: settings.customLanguages,
            fileNamePattern: settings.fileNamePattern,
            includeRefs: settings.includeRefs,
            pageLimit: settings.pageLimit,
          }}
          preview={await filePreview()}
        />
      ) : (
        <AboutSection facts={await aboutFacts()} hosted={hosted} />
      )}
    </SettingsScreen>
  );
}

async function calendarChoices() {
  const connection = await googleView();
  if (connection.status !== "connected" || !connection.canUseCalendar || !connection.canListCalendars) return null;
  try { return await listWritableCalendars(); } catch { return null; }
}

/** What scores the job agent's postings, and whether it's set up (#274). */
async function scoringReadiness() {
  const config = await loadScoringConfig();
  return { scorer: config.scorer, ready: (await scoringProblem(config)) === null };
}




/** The file name preview uses your name and your latest application, or sample values (SET-8). */
async function filePreview() {
  const [name, latest] = await Promise.all([
    loadProfileName(),
    prisma.application.findFirst({ where: { awaitingReview: false }, orderBy: { createdAt: "desc" }, select: { company: true, role: true } }),
  ]);
  return {
    name: name.trim() || "Jane Doe",
    company: latest?.company.trim() || "Ledgerly",
    role: latest?.role.trim() || "Senior Product Designer",
  };
}


/** "12.4 MB" */
function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

/** The About rows (SET-12). */
async function aboutFacts(): Promise<AboutFacts> {
  if (deploymentMode() === "hosted") {
    const [ai, applications] = await Promise.all([loadAiConfig(), prisma.application.count({ where: { awaitingReview: false } })]);
    return [
      { label: "Version", value: appVersion },
      { label: "Access", value: "Free · bring your own API keys" },
      { label: "Sign-in", value: "Verified email and password" },
      { label: "AI", value: [ai.provider === "OPENAI" ? "OpenAI" : providerOption(ai.provider).name, ai.model].filter(Boolean).join(" · ") },
      { label: "Applications", value: String(applications) },
    ];
  }
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() || requestHeaders.get("host") || "Unknown";
  const sqlite = isSqliteUrl(env.DATABASE_URL);
  const [[database], ai, applications] = await Promise.all([
    sqlite
      ? prisma.$queryRaw<{ size: bigint }[]>`SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size()`
      : prisma.$queryRaw<{ size: bigint }[]>`SELECT pg_database_size(current_database()) AS size`,
    loadAiConfig(),
    prisma.application.count({ where: { awaitingReview: false } }),
  ]);
  return [
    { label: "Version", value: appVersion },
    { label: "Server", value: host },
    { label: "Database", value: `${sqlite ? "SQLite" : "PostgreSQL"} · ${formatBytes(Number(database.size))}` },
    { label: "Sign-in", value: isDesktopApp() ? "none, on this computer" : "set via HIRETIVO_PASSWORD" },
    { label: "AI", value: [providerOption(ai.provider).name, ai.model].filter(Boolean).join(" · ") },
    { label: "Applications", value: String(applications) },
  ];
}
