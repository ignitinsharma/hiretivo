"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { FactList } from "@/components/fact-list";
import { MatchRows } from "@/components/match-rows";
import { toast, toastResult } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/use-job";
import type { ApplicationDetails } from "@/lib/application-create";
import type { Match, Requirement } from "@/lib/application-data";
import type { PostingFit } from "@/lib/fit";
import type { JobView } from "@/lib/jobs/runner";
import type { FactItem } from "@/lib/profile";

import { DetailsCard } from "../../new/details-card";
import { ScoreCard } from "../../new/score-card";
import { sectionHref } from "../../profile/sections";
import { saveApplicationDetails, startApplicationScore } from "./actions";

/** The Job posting tab's posting, as saved with the application. */
export type PostingData = {
  text: string;
  /** The saved link to the posting, or "". */
  url: string;
  /** When it was pasted, e.g. "27 Sep". */
  pasted: string;
};

/** "jobs.ledgerly.com/senior-designer" for a link, without the scheme. */
function shortLink(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname === "/" ? "" : pathname}`;
  } catch {
    return url;
  }
}

/**
 * The Job posting tab (APP-11): what the user tells the AI for this
 * application (APP-15), how the profile matches the posting and the posting
 * as pasted, whitespace kept, with a link to the original if saved.
 */
export function PostingTab({
  applicationId,
  posting,
  details,
  initialFitJob,
  match,
  requirements,
  onAddSkill,
  facts,
  setFacts,
}: {
  applicationId: string;
  posting: PostingData;
  details?: ApplicationDetails;
  initialFitJob?: Pick<JobView<PostingFit>, "id" | "status" | "result"> | null;
  match: Match | null;
  requirements: Requirement[];
  onAddSkill: (index: number, skill: string) => void;
  facts: FactItem[];
  setFacts: (change: (facts: FactItem[]) => FactItem[]) => void;
}) {
  const router = useRouter();
  const factsHint = useId();
  const [editingDetails, setEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState(details);
  const [savingDetails, setSavingDetails] = useState(false);
  const [fitJobId, setFitJobId] = useState(initialFitJob?.id ?? null);
  const fitJob = useJob<PostingFit>(fitJobId);
  const fit = fitJob?.status === "DONE" ? fitJob.result : fitJobId === initialFitJob?.id ? initialFitJob?.result ?? null : null;
  const scoring = fitJobId !== null && (fitJob?.status === "RUNNING" || fitJob?.status === "QUEUED" || (!fitJob && fitJobId !== initialFitJob?.id));

  const score = async () => {
    const result = toastResult(await startApplicationScore({ id: applicationId }));
    if (result.ok) setFitJobId(result.data);
  };

  const saveDetails = async () => {
    if (!editedDetails) return;
    setSavingDetails(true);
    const result = toastResult(await saveApplicationDetails({ id: applicationId, details: editedDetails }));
    setSavingDetails(false);
    if (!result.ok) return;
    setEditingDetails(false);
    toast("Application details saved.");
    router.refresh();
  };
  return (
    <div className="@container flex flex-1 flex-col items-center gap-4 overflow-auto bg-canvas px-10 pt-11 pb-16">
      {details && (
        <section className="flex w-full max-w-[640px] flex-col gap-3">
          {editingDetails && editedDetails ? (
            <>
              <DetailsCard details={editedDetails} onChange={setEditedDetails} />
              <div className="flex justify-end gap-2">
                <Button variant="text" onClick={() => { setEditedDetails(details); setEditingDetails(false); }}>Cancel</Button>
                <Button loading={savingDetails} onClick={() => void saveDetails()}>Save details</Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end"><Button variant="secondary" size="sm" onClick={() => setEditingDetails(true)}>Edit job details</Button></div>
          )}
        </section>
      )}
      <div className="w-full max-w-[640px]"><ScoreCard fit={fit ?? null} scoring={scoring} step={fitJob?.step ?? null} onScore={() => void score()} /></div>
      {fitJob?.status === "FAILED" && <p role="alert" className="w-full max-w-[640px] text-sm text-danger">{fitJob.error ?? "Scoring failed. Try again."}</p>}
      <section
        aria-labelledby={`${factsHint}-title`}
        aria-describedby={factsHint}
        className="flex w-full max-w-[640px] flex-col gap-4 rounded-panel border border-line-card bg-card px-[30px] py-7"
      >
        <div className="flex flex-col gap-1.5">
          <h2 id={`${factsHint}-title`} className="text-subsection">
            Facts for this application
          </h2>
          <p id={factsHint} className="text-sm text-pretty text-muted">
            What the AI should know for this job only, on top of your profile&apos;s{" "}
            <Link href={sectionHref("facts")} className="text-muted underline underline-offset-2 hover:text-ink">
              Facts about me
            </Link>
            . It uses them the next time it writes or rewrites something here.
          </p>
        </div>
        <FactList
          applicationId={applicationId}
          facts={facts}
          setFacts={setFacts}
          placeholder="e.g. I met their design lead at Config last year. Or: lean on my research work."
        />
      </section>
      <div className="flex w-full max-w-[640px] flex-wrap justify-between gap-x-3 gap-y-1 text-meta text-muted">
        <span className="min-w-0">
          Job posting
          {posting.url && (
            <>
              {" · "}
              <a
                href={posting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-muted underline underline-offset-2 hover:text-ink"
              >
                {shortLink(posting.url)}
                <span aria-hidden="true"> ↗</span>{" "}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </>
          )}
        </span>
        <span>Pasted {posting.pasted}</span>
      </div>
      <div className="flex w-full max-w-[640px] flex-col gap-[22px] rounded-panel border border-line-card bg-card px-[30px] py-7">
        {match && match.items.length > 0 && <MatchRows match={match} requirements={requirements} onAddSkill={onAddSkill} />}
        <div className={match && match.items.length > 0 ? "flex flex-col gap-2.5 border-t border-line pt-5" : "flex flex-col gap-2.5"}>
          <h2 className="text-subsection">Original posting</h2>
          {posting.text.trim() ? (
            <p className="text-sm leading-[1.65] whitespace-pre-wrap text-document">{posting.text}</p>
          ) : (
            <p className="text-sm text-muted">No posting was saved with this application.</p>
          )}
        </div>
      </div>
    </div>
  );
}
