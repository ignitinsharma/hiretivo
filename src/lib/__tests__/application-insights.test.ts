import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PipelineStage } from '@/constants/enums';
import { summarizeApplications } from '@/lib/application-insights';

describe('application dashboard insights', () => {
  it('counts the furthest stage reached, including rejected applications', () => {
    const result = summarizeApplications([
      { pipelineStage: PipelineStage.NOT_APPLIED, furthestPipelineStage: PipelineStage.NOT_APPLIED, createdAt: new Date('2026-11-02T12:00:00Z') },
      { pipelineStage: PipelineStage.APPLIED, furthestPipelineStage: PipelineStage.APPLIED, createdAt: new Date('2026-11-03T12:00:00Z') },
      { pipelineStage: PipelineStage.REJECTED, furthestPipelineStage: PipelineStage.INTERVIEWING, createdAt: new Date('2026-11-04T12:00:00Z') },
      { pipelineStage: PipelineStage.OFFER, furthestPipelineStage: PipelineStage.OFFER, createdAt: new Date('2026-10-28T12:00:00Z') },
    ], 4, new Date('2026-11-07T12:00:00Z'));

    assert.deepEqual(result.funnel.map(({ count }) => count), [3, 2, 1]);
    assert.equal(result.statuses.find(({ stage }) => stage === PipelineStage.REJECTED)?.count, 1);
    assert.equal(result.total, 4);
  });

  it('groups saved applications into calendar weeks for the selected period', () => {
    const result = summarizeApplications([
      { pipelineStage: PipelineStage.APPLIED, furthestPipelineStage: PipelineStage.APPLIED, createdAt: new Date('2026-11-07T12:00:00Z') },
      { pipelineStage: PipelineStage.APPLIED, furthestPipelineStage: PipelineStage.APPLIED, createdAt: new Date('2026-11-03T12:00:00Z') },
      { pipelineStage: PipelineStage.APPLIED, furthestPipelineStage: PipelineStage.APPLIED, createdAt: new Date('2026-10-28T12:00:00Z') },
      { pipelineStage: PipelineStage.APPLIED, furthestPipelineStage: PipelineStage.APPLIED, createdAt: new Date('2026-09-01T12:00:00Z') },
    ], 4, new Date('2026-11-07T12:00:00Z'));

    assert.deepEqual(result.weeks.map(({ count }) => count), [0, 0, 1, 2]);
    assert.deepEqual(result.weeks.map(({ startsOn }) => startsOn), ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02']);
  });
});
