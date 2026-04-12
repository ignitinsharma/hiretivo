import { NextResponse } from 'next/server'

/**
 * DEBUG ENDPOINT - Check which environment variables are set
 * DELETE THIS FILE after debugging!
 */
export async function GET() {
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,

    // Show which environment
    VERCEL_ENV: process.env.VERCEL_ENV || 'local',
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',

    // Show first 10 chars of DATABASE_URL (safe)
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 15) || 'NOT SET',
  }

  return NextResponse.json(envCheck)
}
