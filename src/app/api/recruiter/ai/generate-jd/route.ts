import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { AiMessageRole, UserRole, PlanTier } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { JdGeneratorSchema } from '@/lib/validations/jd-generator.schema';
import { createRateLimiter } from '@/lib/rate-limit';
import { buildJdGeneratorMessages, JD_GENERATOR_CONFIG } from '@/lib/ai-prompts';
import { isAiTrialActive } from '@/lib/ai-trial';

const generateJdRateLimiter = createRateLimiter('generate-jd', 5, '1 m');

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

  // 4. Plan gate — FREE plan cannot access AI features (bypass during trial)
  if (session.user.plan === PlanTier.FREE && !isAiTrialActive()) {
    return new Response(
      JSON.stringify({ error: 'AI job description generation requires a PRO or ENTERPRISE plan.' }),
      { status: 403 },
    );
  }

  // 5. Parse + Zod validate
  const body = await req.json().catch(() => null);
  const parsed = JdGeneratorSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
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
