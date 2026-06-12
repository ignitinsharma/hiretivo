import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { AiMessageRole, UserRole, PlanTier, AiFeature } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { JdGeneratorSchema } from '@/lib/validations/jd-generator.schema';
import { createRateLimiter } from '@/lib/rate-limit';
import { buildJdGeneratorMessages, JD_GENERATOR_CONFIG } from '@/lib/ai-prompts';
import { consumeFreeDailyAiQuota, consumePaidDailyAiCap } from '@/lib/billing/ai-daily-limit';

const generateJdRateLimiter = createRateLimiter('generate-jd', 5, '1 m');

/*
 * POST /api/recruiter/ai/generate-jd
 * Generates or regenerates a recruiter job description as streamed HTML.
 * Request body: { title, shortDesc, vibe?, isRegeneration? }
 * Returns: text/html-compatible plain text stream or JSON error.
 */
export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== UserRole.RECRUITER) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // 3. Rate limit
  const { success } = await generateJdRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  // 4. Parse + Zod validate
  const body = await req.json().catch(() => null);
  const parsed = JdGeneratorSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }

  // 5. Plan gate — FREE plan gets 3 JD generations/day; paid plans get a high
  // daily safety ceiling (anti-abuse, not a product limit).
  if (session.user.plan === PlanTier.FREE) {
    const allowed = await consumeFreeDailyAiQuota(AiFeature.JD, session.user.id);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error:
            "You've used your 3 free AI job descriptions today. Upgrade to a paid plan for unlimited generations.",
        }),
        { status: 403 },
      );
    }
  } else {
    const withinCap = await consumePaidDailyAiCap(AiFeature.JD, session.user.id);
    if (!withinCap) {
      return new Response(
        JSON.stringify({ error: "Daily AI usage limit reached. Please try again tomorrow." }),
        { status: 429 },
      );
    }
  }

  // 6. Call OpenRouter with streaming for faster perceived response
  const { system, user } = buildJdGeneratorMessages(parsed.data);
  const stream = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...JD_GENERATOR_CONFIG,
    stream: true,
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  // 7. Stream the response back to the client as plain text
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? '';
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
