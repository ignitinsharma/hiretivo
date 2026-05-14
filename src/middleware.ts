import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

/*
 * Next.js middleware
 * Protects /admin/* routes by gating on the ADMIN_EMAIL env var.
 * Non-admin sessions (unauthenticated or wrong email) get redirected
 * to the recruiter login page with a `next` param pointing back to the
 * originally requested admin URL.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const userEmail = req.auth?.user?.email?.trim().toLowerCase();
    if (!ADMIN_EMAIL || !userEmail || userEmail !== ADMIN_EMAIL) {
      const loginUrl = new URL('/auth/recruiter/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
