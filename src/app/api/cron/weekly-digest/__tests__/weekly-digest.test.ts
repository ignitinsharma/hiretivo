import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SOURCE = 'src/app/api/cron/weekly-digest/route.ts';
const src = readFileSync(SOURCE, 'utf8');

describe('GET /api/cron/weekly-digest', () => {
  it('checks CRON_SECRET authorization header', () => {
    assert.match(src, /CRON_SECRET/);
    assert.match(src, /Bearer/);
    assert.match(src, /status: 401/);
  });

  it('filters by digestEnabled and lastDigestSentAt', () => {
    assert.match(src, /digestEnabled: true/);
    assert.match(src, /lastDigestSentAt/);
    assert.match(src, /sixDaysAgo/);
  });

  it('caps batch size', () => {
    assert.match(src, /DIGEST_BATCH_SIZE/);
    assert.match(src, /take: DIGEST_BATCH_SIZE/);
  });

  it('skips seeker when no email', () => {
    assert.match(src, /seeker\.user\.email/);
    assert.match(src, /skipped\+\+/);
  });

  it('skips seeker when no matches', () => {
    assert.match(src, /jobMatches\.length === 0/);
  });

  it('updates lastDigestSentAt after send', () => {
    assert.match(src, /lastDigestSentAt: new Date/);
  });

  it('continues on per-seeker error', () => {
    assert.match(src, /catch \(err\)/);
    assert.match(src, /continue — one failed/);
  });

  it('returns sent/skipped summary', () => {
    assert.match(src, /sent, skipped/);
    assert.match(src, /status: 200/);
  });
});
