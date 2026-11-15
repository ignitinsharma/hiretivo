-- Shared identity records. App data lives in a separate schema per verified user.
CREATE TABLE IF NOT EXISTS public."HostedUser" (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  "verifiedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."HostedSession" (
  "tokenHash" text PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES public."HostedUser"(id) ON DELETE CASCADE,
  persistent boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "expiresAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "HostedSession_userId" ON public."HostedSession" ("userId");
CREATE TABLE IF NOT EXISTS public."HostedToken" (
  "tokenHash" text PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES public."HostedUser"(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify', 'reset')),
  "expiresAt" timestamptz NOT NULL,
  UNIQUE ("userId", purpose)
);
CREATE TABLE IF NOT EXISTS public."HostedAuthThrottle" (
  key text PRIMARY KEY,
  count integer NOT NULL,
  "windowStart" timestamptz NOT NULL
);
