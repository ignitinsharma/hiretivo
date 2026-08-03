import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import type { NextRequest } from 'next/server';

const ENV_KEYS = ['VERCEL_ENV', 'NEXT_PUBLIC_APP_URL', 'VERCEL_URL'] as const;

describe('config', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  async function loadConfig() {
    return import('../config.js');
  }

  describe('getAppUrl', () => {
    it('honors NEXT_PUBLIC_APP_URL in production', async () => {
      process.env.VERCEL_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://www.hiretivo.com';
      const { getAppUrl } = await loadConfig();
      assert.equal(getAppUrl(), 'https://www.hiretivo.com');
    });

    it('falls back to hiretivo.com in production without the var', async () => {
      process.env.VERCEL_ENV = 'production';
      const { getAppUrl } = await loadConfig();
      assert.equal(getAppUrl(), 'https://hiretivo.com');
    });

    // Regression: staging with a prod-valued NEXT_PUBLIC_APP_URL redirected
    // post-payment users to hiretivo.com, breaking sessions + upgrades.
    it('ignores a prod-valued NEXT_PUBLIC_APP_URL outside production', async () => {
      process.env.VERCEL_ENV = 'preview';
      process.env.NEXT_PUBLIC_APP_URL = 'https://hiretivo.com';
      process.env.VERCEL_URL = 'hiretivo-git-staging-x.vercel.app';
      const { getAppUrl } = await loadConfig();
      assert.equal(getAppUrl(), 'https://hiretivo-git-staging-x.vercel.app');
    });

    it('honors a non-prod NEXT_PUBLIC_APP_URL outside production', async () => {
      process.env.VERCEL_ENV = 'preview';
      process.env.NEXT_PUBLIC_APP_URL = 'https://staging.hiretivo.com';
      const { getAppUrl } = await loadConfig();
      assert.equal(getAppUrl(), 'https://staging.hiretivo.com');
    });

    it('falls back to localhost with no env config', async () => {
      const { getAppUrl } = await loadConfig();
      assert.equal(getAppUrl(), 'http://localhost:3000');
    });
  });

  describe('getRequestAppUrl', () => {
    function reqWithOrigin(origin: string): NextRequest {
      return { nextUrl: { origin } } as unknown as NextRequest;
    }

    it('uses the request origin for our domains and previews', async () => {
      const { getRequestAppUrl } = await loadConfig();
      for (const origin of [
        'https://www.hiretivo.com',
        'https://staging.hiretivo.com',
        'https://hiretivo-git-staging-x.vercel.app',
        'http://localhost:3000',
      ]) {
        assert.equal(getRequestAppUrl(reqWithOrigin(origin)), origin);
      }
    });

    it('rejects a spoofed Host and falls back to getAppUrl', async () => {
      process.env.VERCEL_ENV = 'production';
      const { getRequestAppUrl } = await loadConfig();
      assert.equal(
        getRequestAppUrl(reqWithOrigin('https://evil.com')),
        'https://hiretivo.com',
      );
    });
  });
});
