import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';

describe('unsubscribe-token', () => {
  before(() => { process.env.UNSUBSCRIBE_SECRET = 'test-secret-32-chars-long-enough!'; });
  after(() => { delete process.env.UNSUBSCRIBE_SECRET; });

  it('generates a 64-char hex token', async () => {
    const { generateUnsubscribeToken } = await import('../unsubscribe-token.js');
    const token = generateUnsubscribeToken('user_123');
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 64);
    assert.match(token, /^[0-9a-f]+$/);
  });

  it('verifies a valid token', async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import('../unsubscribe-token.js');
    const token = generateUnsubscribeToken('user_abc');
    assert.equal(verifyUnsubscribeToken('user_abc', token), true);
  });

  it('rejects a tampered token', async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import('../unsubscribe-token.js');
    const token = generateUnsubscribeToken('user_abc');
    const tampered = token.slice(0, -2) + 'ff';
    assert.equal(verifyUnsubscribeToken('user_abc', tampered), false);
  });

  it('rejects token for wrong userId', async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import('../unsubscribe-token.js');
    const token = generateUnsubscribeToken('user_a');
    assert.equal(verifyUnsubscribeToken('user_b', token), false);
  });
});
