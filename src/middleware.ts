import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

/*
 * Next.js middleware
 * Protects /admin/* routes by gating on the ADMIN_EMAIL env var.
 * Non-admin sessions (unauthenticated or wrong email) get redirected
 * to the recruiter login page.
 * ADMIN_EMAIL is read per-request so deploys that inject env at container
 * runtime (not build time) still pick it up.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = req.auth?.user?.email?.trim().toLowerCase();
    if (!adminEmail || !userEmail || userEmail !== adminEmail) {
      const loginUrl = new URL('/auth/recruiter/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/seeker/verification')) {
    if (!req.auth?.user?.id) {
      const loginUrl = new URL('/auth/seeker/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/seeker/verification/:path*'],
};
