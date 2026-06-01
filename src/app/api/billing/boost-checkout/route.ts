import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { JobStatus, UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { dodo } from '@/lib/dodo';
import { BoostCheckoutSchema } from '@/lib/validations/boost-checkout.schema';
import { createRateLimiter } from '@/lib/rate-limit';
import { requireVerifiedEmailForTrustedAction } from '@/lib/auth/email-verification';

const boostCheckoutRateLimiter = createRateLimiter('boost-checkout', 5, '1 m');

function getAppUrl(req: NextRequest): string {
  return req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://hiretivo.com';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const verificationError = await requireVerifiedEmailForTrustedAction(
    session.user.id,
  );
  if (verificationError) return verificationError;

  const { success } = await boostCheckoutRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = BoostCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { jobId } = parsed.data;

  // T-13-13: Ownership check — prevent boosting another recruiter's job
  const job = await prisma.job.findFirst({
    where: { id: jobId, recruiterId: session.user.id, status: { not: JobStatus.CLOSED } },
    select: { id: true },
  });
  if (!job) {
    // Return 404 (not 403) — prevents leaking job existence to other recruiters (T-13-16)
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (!process.env.DODO_BOOST_PRODUCT_ID) {
    return NextResponse.json({ error: 'Boost product not configured' }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, billingCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const appUrl = getAppUrl(req);

  const customerPayload = user.billingCustomerId
    ? ({ customer_id: user.billingCustomerId } as const)
    : ({
        email: user.email ?? session.user.email ?? '',
        name: user.name ?? session.user.name ?? '',
      } as const);

  const payment = await dodo.payments.create({
    billing: { country: 'IN' },
    customer: customerPayload,
    product_cart: [{ product_id: process.env.DODO_BOOST_PRODUCT_ID, quantity: 1 }],
    payment_link: true,
    return_url: `${appUrl}/recruiter/jobs/${jobId}?boost=success`,
    metadata: { userId: session.user.id, jobId, type: 'boost' },
  });

  return NextResponse.json({ data: { url: payment.payment_link } }, { status: 200 });
}
