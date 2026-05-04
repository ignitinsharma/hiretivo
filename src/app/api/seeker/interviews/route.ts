import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { InterviewStatus, UserRole } from '@/constants/enums';
import { createRateLimiter } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter('seeker-interviews', 30, '1 m');

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return new Response('Forbidden', { status: 403 });
  }

  const { success } = await rateLimiter.limit(session.user.id);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const seekerUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });

  const interviews = await prisma.interview.findMany({
    where: {
      seekerId: session.user.id,
      status: InterviewStatus.SCHEDULED,
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      meetLink: true,
      notes: true,
      status: true,
      scheduledTimeZone: true,
      application: {
        select: {
          job: {
            select: { title: true },
          },
        },
      },
      recruiter: {
        select: {
          name: true,
          recruiterProfile: {
            select: { companyName: true },
          },
        },
      },
    },
    orderBy: { startsAt: 'asc' },
  });

  const data = interviews.map((interview) => ({
    id: interview.id,
    startsAt: interview.startsAt?.toISOString() ?? null,
    endsAt: interview.endsAt?.toISOString() ?? null,
    meetLink: interview.meetLink,
    notes: interview.notes,
    status: interview.status,
    scheduledTimeZone: interview.scheduledTimeZone,
    viewerTimezone: seekerUser?.timezone ?? null,
    jobTitle: interview.application.job.title,
    companyName:
      interview.recruiter.recruiterProfile?.companyName ??
      interview.recruiter.name ??
      'Unknown',
    interviewerName: interview.recruiter.name ?? 'Recruiter',
  }));

  return Response.json({ data }, { status: 200 });
}
