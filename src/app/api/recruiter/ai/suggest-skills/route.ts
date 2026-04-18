import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { SkillSuggestSchema } from '@/lib/validations/skill-suggest.schema';
import { createRateLimiter } from '@/lib/rate-limit';

const suggestSkillsRateLimiter = createRateLimiter('suggest-skills', 20, '1 m');

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Rate limit
  const { success } = await suggestSkillsRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 4. Parse + Zod validate
  const body = await req.json().catch(() => null);
  const parsed = SkillSuggestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 5. Call OpenRouter
  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    messages: [
      {
        role: 'system',
        content:
          'You are a technical skills extractor. Given a job description, return a JSON array of the 8 most relevant technical skills required. Return ONLY a valid JSON array of strings — no markdown, no explanation, no code fences. Example: ["TypeScript","React","Node.js"]',
      },
      {
        role: 'user',
        content: parsed.data.descriptionText.slice(0, 3000), // truncate to avoid token waste
      },
    ],
    max_tokens: 150,
    temperature: 0.1,
  });

  // 6. Parse response — handle malformed JSON from model (T-13-11)
  let skills: string[] = [];
  try {
    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    const parsedSkills = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsedSkills)) {
      skills = parsedSkills.filter((s): s is string => typeof s === 'string').slice(0, 10);
    }
  } catch {
    skills = []; // safe fallback — return empty array, never 500
  }

  // 7. Return
  return NextResponse.json({ data: { skills } }, { status: 200 });
}
