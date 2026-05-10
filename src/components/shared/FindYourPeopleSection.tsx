import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FindYourPeopleSectionProps {
  clientCount: string;
  candidateCount: string;
  className?: string;
}

const PROOF_SIGNALS = [
  "Engineering teams",
  "Product squads",
  "Design partners",
  "Growth teams",
  "Remote-first hiring",
];

/*
 * withPlus
 * Normalizes proof values so social proof cards always include a plus suffix.
 * @param value - Count label to display
 * @returns Count label with a trailing plus sign
 */
function withPlus(value: string): string {
  return value.endsWith("+") ? value : `${value}+`;
}

/*
 * FindYourPeopleSection
 * Renders recruiter social proof with a static image and proof-card stack.
 * @param clientCount - Public company proof number
 * @param candidateCount - Public candidate proof number
 * @param className - Optional section wrapper classes
 */
export function FindYourPeopleSection({
  clientCount,
  candidateCount,
  className = "bg-white px-4 py-20 md:px-8",
}: FindYourPeopleSectionProps) {
  return (
    <section className={className} data-purpose="find-your-people-section">
      <div className="grid-bg mx-auto max-w-7xl overflow-hidden rounded-xl border border-brand-border bg-white p-6 md:p-10 lg:p-14">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative z-10">
            <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl lg:text-6xl">
              Stop hiring candidates. Start finding your people.
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-brand-foreground">
              Great hiring happens when the right people find where they belong.
              Hiretivo gives you everything you need to build teams that last.
            </p>
            <div className="mt-8">
              <Button asChild variant="primary" size="lg">
                <Link href="/recruiter/register">
                  Post your job today
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative min-h-[500px] lg:min-h-[620px]">
            <div className="absolute left-0 top-0 z-20 w-52 rounded-xl border border-brand-border bg-white md:left-[-10px] md:w-64">
              <div className="border-b border-brand-border px-4 py-2 text-center text-sm font-semibold text-brand-foreground">
                Our clients
              </div>
              <div className="bg-white px-4 py-4">
                <p className="text-3xl font-bold tracking-tight text-brand-foreground">
                  {withPlus(clientCount)}
                </p>
                <p className="mt-2 text-sm font-semibold leading-snug text-brand-foreground">
                  Companies building remote teams with us
                </p>
              </div>
            </div>

            <div className="absolute right-[-18px] top-8 z-10 h-[445px] w-[106%] overflow-hidden rounded-xl border border-brand-border bg-white md:h-[535px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Diverse team reviewing hiring work around a laptop"
                className="h-full w-full object-cover"
                src="https://images.pexels.com/photos/7652189/pexels-photo-7652189.jpeg?auto=compress&cs=tinysrgb&w=1200"
              />
            </div>

            <div className="absolute bottom-0 right-0 z-20 w-60 rounded-xl border border-brand-border bg-white md:w-72">
              <div className="border-b border-brand-border px-4 py-2 text-center text-sm font-semibold text-brand-foreground">
                Our candidates
              </div>
              <div className="bg-white px-4 py-4">
                <p className="text-3xl font-bold tracking-tight text-brand-foreground">
                  {withPlus(candidateCount)}
                </p>
                <p className="mt-2 text-sm font-semibold leading-snug text-brand-foreground">
                  Candidates building profiles where they belong
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden justify-center lg:flex">
            <p className="max-w-48 text-center text-4xl font-normal leading-none tracking-normal text-brand-foreground">
              FIND
              <br />
              YOUR
              <br />
              PEOPLE
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 lg:grid-cols-5">
            {PROOF_SIGNALS.map((signal) => (
              <div
                key={signal}
                className="rounded-xl border border-brand-primary/20 bg-white px-4 py-4 text-sm font-bold text-brand-foreground"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
