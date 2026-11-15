"use client";

import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIVACY_URL, REPOSITORY_URL } from "@/lib/repository";

import { SettingsSectionIntro } from "./settings-screen";

export type AboutFacts = { label: string; value: string }[];

const LINK = "font-medium text-ink underline underline-offset-2";

/**
 * Settings → About (SET-12): facts about this install, and where to find
 * Hiretivo Open Source, its documentation and its privacy page.
 */
export function AboutSection({ facts, hosted = false }: { facts: AboutFacts; hosted?: boolean }) {
  return (
    <>
      <SettingsSectionIntro title={hosted ? "About Hiretivo" : "About this install"}>{hosted ? "Free to use. Your own API keys. No subscriptions." : "Free and open source. No accounts, no subscriptions."}</SettingsSectionIntro>
      <Card padding="none" className="px-7 py-2">
        <dl>
          {facts.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 border-t border-line py-3.5 text-sm first:border-t-0">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-mono text-[13px] [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card padding="none" className="flex flex-wrap items-center justify-between gap-3 px-7 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Setup guide</span>
          <span className="text-meta text-muted">Walks through the AI, job search, scoring, Gmail and Calendar, and your profile, one step at a time.</span>
        </div>
        <Link href="/welcome?step=start" className={buttonClassName("secondary", "sm")}>
          Open the setup guide
        </Link>
      </Card>
      <Card padding="none" className="flex flex-col gap-2 px-7 py-4">
        <span className="text-sm font-medium">Hiretivo Open Source</span>
        <p className="text-meta text-muted">
          The code is yours to run, read and change.{" "}
          <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
            Source code <span className="sr-only">(opens in a new tab)</span>
          </a>
          {" · "}
          <a href={`${REPOSITORY_URL}#readme`} target="_blank" rel="noopener noreferrer" className={LINK}>
            Documentation <span className="sr-only">(opens in a new tab)</span>
          </a>
          {" · "}
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
            Privacy <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
        <p className="text-meta text-muted">Hiretivo never sends telemetry and never contacts update or announcement servers.</p>
      </Card>
    </>
  );
}
