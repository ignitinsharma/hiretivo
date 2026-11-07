import { PipelineStage } from '@/constants/enums';

type PipelineStageValue = `${PipelineStage}`;

export interface ApplicationInsightRecord {
  pipelineStage: PipelineStageValue;
  furthestPipelineStage: PipelineStageValue;
  createdAt: Date;
}

export interface ApplicationInsights {
  total: number;
  funnel: Array<{ stage: PipelineStage; count: number }>;
  statuses: Array<{ stage: PipelineStage; count: number }>;
  weeks: Array<{ startsOn: string; count: number }>;
}

const PROGRESS: PipelineStage[] = [PipelineStage.NOT_APPLIED, PipelineStage.APPLIED, PipelineStage.INTERVIEWING, PipelineStage.OFFER];
const FUNNEL = [PipelineStage.APPLIED, PipelineStage.INTERVIEWING, PipelineStage.OFFER] as const;
const STATUSES = [PipelineStage.NOT_APPLIED, PipelineStage.APPLIED, PipelineStage.INTERVIEWING, PipelineStage.OFFER, PipelineStage.REJECTED] as const;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Returns the higher non-terminal milestone so a rejection never erases progress. */
export function furthestStage(previous: PipelineStageValue, next: PipelineStageValue): PipelineStage {
  const previousIndex = PROGRESS.indexOf(previous as PipelineStage);
  const nextIndex = PROGRESS.indexOf(next as PipelineStage);
  return PROGRESS[Math.max(previousIndex, nextIndex, 0)];
}

/** Summarizes saved applications for the authenticated dashboard response. */
export function summarizeApplications(records: ApplicationInsightRecord[], periodWeeks: number, now: Date): ApplicationInsights {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const firstWeek = monday.getTime() - (periodWeeks - 1) * WEEK_MS;
  const weeks = Array.from({ length: periodWeeks }, (_, index) => ({
    startsOn: new Date(firstWeek + index * WEEK_MS).toISOString().slice(0, 10),
    count: 0,
  }));

  for (const record of records) {
    const index = Math.floor((record.createdAt.getTime() - firstWeek) / WEEK_MS);
    if (index >= 0 && index < periodWeeks) weeks[index].count += 1;
  }

  return {
    total: records.length,
    funnel: FUNNEL.map((stage) => ({ stage, count: records.filter((record) => {
      const reached = furthestStage(record.furthestPipelineStage, record.pipelineStage);
      return PROGRESS.indexOf(reached) >= PROGRESS.indexOf(stage);
    }).length })),
    statuses: STATUSES.map((stage) => ({ stage, count: records.filter((record) => record.pipelineStage === stage).length })),
    weeks,
  };
}
