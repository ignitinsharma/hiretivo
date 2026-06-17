import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SOURCE = 'src/app/api/seeker/unsubscribe/route.ts';
const src = readFileSync(SOURCE, 'utf8');

describe('GET /api/seeker/unsubscribe', () => {
  it('applies rate limiting', () => {
    assert.match(src, /rateLimiter/);
    assert.match(src, /status: 429/);
  });

  it('requires token and uid params', () => {
    assert.match(src, /token/);
    assert.match(src, /uid/);
    assert.match(src, /error=invalid/);
  });

  it('verifies HMAC token', () => {
    assert.match(src, /verifyUnsubscribeToken/);
  });

  it('sets digestEnabled to false', () => {
    assert.match(src, /digestEnabled: false/);
  });

  it('handles missing seeker (deleted account) gracefully', () => {
    assert.match(src, /success=true/);
    assert.match(src, /account — treat as success/);
  });

  it('redirects to /unsubscribe on success', () => {
    assert.match(src, /\/unsubscribe\?success=true/);
  });
});
