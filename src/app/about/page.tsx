import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Globe, Heart, Zap, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "About Us",
  description: "Learn about Hiretivo's mission to connect talent with opportunity through skills-based matching.",
  path: "/about",
});

const STATS = [
  { value: "2.4k", label: "Dream Roles", colorClass: "text-black" },
  { value: "840", label: "Partners", colorClass: "text-[#FFD166]" },
  { value: "12k", label: "Hired", colorClass: "text-black" },
  { value: "48", label: "Countries", colorClass: "text-[#FFD166]" },
];

const TEAM = [
  {
    name: "Alex Rivers",
    role: "Founder & CEO",
    bgColor: "bg-[#FFD6E0]",
    iconColor: "text-rose-500",
    initial: "AR",
    rotation: "rotate-6 group-hover:rotate-12",
  },
  {
    name: "Sarah Chen",
    role: "Product Lead",
    bgColor: "bg-[#D8F3DC]",
    iconColor: "text-black",
    initial: "SC",
    rotation: "-rotate-6 group-hover:-rotate-12",
  },
  {
    name: "Marcus Thorne",
    role: "Engineering",
    bgColor: "bg-gray-100",
    iconColor: "text-black",
    initial: "MT",
    rotation: "rotate-2 group-hover:rotate-6",
  },
  {
    name: "Elena Vance",
    role: "Community",
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
    initial: "EV",
    rotation: "-rotate-3 group-hover:-rotate-8",
  },
];

const VALUES = [
  {
    title: "Remote-first, always",
    description:
      "We don't just post jobs; we live the lifestyle. Every process we build is crafted for asynchronous freedom.",
    containerClass: "bg-gray-50/50 hover:bg-brand-primary",
    iconContainerClass: "text-black",
    icon: Globe,
    titleClass: "group-hover:text-white",
    descClass: "group-hover:text-gray-50",
  },
  {
    title: "Radical Transparency",
    description:
      "Honest salaries and clear expectations. We're cutting out the corporate guesswork to save you time.",
    containerClass: "bg-yellow-50/50 hover:bg-[#FFD166]",
    iconContainerClass: "text-yellow-600",
    icon: Heart,
    titleClass: "group-hover:text-slate-900",
    descClass: "group-hover:text-slate-700",
  },
  {
    title: "Builder mindset",
    description:
      "We're constantly iterating. If something's broken, we fix it together. Progress is our only metric.",
    containerClass: "bg-gray-50/50 hover:bg-brand-primary",
    iconContainerClass: "text-black",
    icon: Zap,
    titleClass: "group-hover:text-white",
    descClass: "group-hover:text-white",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 antialiased selection:bg-[#FFD166]/30">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#EEF2FF_0%,transparent_50%),radial-gradient(circle_at_bottom_left,#FFF8E7_0%,transparent_50%)] py-24 px-6">
          <div className="relative mx-auto max-w-7xl text-center">
            {/* Decorative blobs */}
            <div className="absolute -left-12 -top-12 h-32 w-32 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[#FFD166]/20 blur-2xl"></div>
            <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-black/10 blur-2xl"></div>

            <h1 className="mx-auto max-w-4xl font-['Fraunces',serif] text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              We believe work should{" "}
              <span className="italic text-black">fit your life</span>, not
              the other way around.
            </h1>
            <p className="mx-auto mt-10 max-w-2xl text-xl leading-relaxed text-slate-600">
              WorkRemote was born from a simple dream: a world where your career
              fuels your adventures rather than limiting them. We&apos;re building
              the bridge to that future.
            </p>

            <div className="group relative mt-16">
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-r from-black/10 to-[#FFD166]/10 opacity-50 blur-xl transition duration-1000 group-hover:opacity-75"></div>
              <div className="relative aspect-[16/7] overflow-hidden rounded-[3rem] bg-slate-100 shadow-2xl">
                <Image
                  alt="Remote workers"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzAADv8MrlR0IDWTUBnxTPsHu7291RXpCnrU21qSdfzbDE4TFsUAW4b7Ss-AM-_ody2jRwPn4aFXQB01Tx-PVKNLgd-owBLevW_lI4xf8E8dp8yLjfbmsJtKAzRIiYF-4q6M35xFVjkAmbs8c1HCJ9CTOb7mwNvLyLn0N5pzjvfi9XzQcPsIFxhfKKE07XhGflzyoge69FPoXg4Cw86PZqIAffcrZUCQuFLIIqVbqlJjKd6LwQeXPHLq6hNhWHGDkKOkHIJHgtDWxK"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Why Section */}
        <section className="bg-[#FDFCFB] py-32 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="order-2 space-y-8 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-bold tracking-wide text-black">
                  <Heart className="h-5 w-5" /> OUR WHY
                </div>
                <h2 className="font-['Fraunces',serif] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  Human-centered hiring.
                </h2>
                <div className="space-y-6 text-xl leading-relaxed text-slate-600">
                  <p>
                    Traditional job boards feel like databases. We wanted
                    something that felt like a community. The old model of
                    commuting to a gray cubicle is over—we&apos;re just here to speed
                    up the transition.
                  </p>
                  <p>
                    Whether you&apos;re a digital nomad in Bali or a parent in
                    Seattle, we help you find work that respects your time and
                    celebrates your talent.
                  </p>
                </div>
              </div>
              <div className="relative order-1 lg:order-2">
                <div className="absolute -left-12 -top-12 h-24 w-24 animate-pulse rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[#FFD166] opacity-20"></div>
                <blockquote className="relative z-10 font-['Fraunces',serif] text-3xl font-medium italic leading-[1.3] text-black md:text-5xl md:leading-[1.4]">
                  &quot;Remote work isn&apos;t just a trend—it&apos;s a{" "}
                  <span className="rounded-lg bg-[#FFD166]/30 px-2">
                    movement
                  </span>
                  . We&apos;re just making the path clearer for everyone.&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-brand-border-light bg-white py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="group text-center">
                  <div
                    className={cn(
                      "text-5xl font-bold transition-transform duration-300 group-hover:scale-110 md:text-6xl",
                      stat.colorClass,
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-[#FDFCFB] py-32 px-6">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-4 font-['Fraunces',serif] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              The folks behind the magic
            </h2>
            <p className="mx-auto mb-20 max-w-2xl text-xl text-slate-500">
              We&apos;re a distributed team of builders, creators, and dreamers
              working from 12 different timezones.
            </p>

            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {TEAM.map((member) => (
                <div key={member.name} className="group relative pt-12">
                  <div className="absolute inset-0 rounded-xl bg-white transition-transform group-hover:-translate-y-2"></div>
                  <div className="relative flex flex-col items-center p-8">
                    <div
                      className={cn(
                        "absolute -top-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white transition-transform",
                        member.bgColor,
                        member.rotation,
                      )}
                    >
                      <span
                        className={cn("text-3xl font-bold", member.iconColor)}
                      >
                        {member.initial}
                      </span>
                    </div>
                    <h3 className="mt-12 text-xl font-bold text-slate-900">
                      {member.name}
                    </h3>
                    <p className="mb-6 text-sm font-medium uppercase tracking-wider text-black">
                      {member.role}
                    </p>
                    <div className="flex gap-4">
                      <a
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-black/10 hover:text-black"
                        href="#"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-white py-32 px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-16 font-['Fraunces',serif] text-4xl font-bold tracking-tight text-slate-900">
              The values that guide us.
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className={cn(
                    "group rounded-xl p-10 transition-all duration-500 hover:scale-[1.02]",
                    value.containerClass,
                  )}
                >
                  <div
                    className={cn(
                      "mb-8 flex h-14 w-14 items-center justify-center rounded-xl bg-white transition-transform group-hover:scale-110",
                      value.iconContainerClass,
                    )}
                  >
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3
                    className={cn(
                      "mb-4 text-2xl font-bold text-slate-900",
                      value.titleClass,
                    )}
                  >
                    {value.title}
                  </h3>
                  <p
                    className={cn(
                      "leading-relaxed text-slate-600",
                      value.descClass,
                    )}
                  >
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-24">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[4rem] bg-slate-900 py-24 px-10 text-center">
            <div className="absolute right-0 top-0 -mt-48 -mr-48 h-96 w-96 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-black/20 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="mx-auto max-w-3xl font-['Fraunces',serif] text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                Your next adventure is just one click away.
              </h2>
              <p className="mx-auto mt-8 mb-12 max-w-xl text-xl text-slate-400">
                Join over 50,000 professionals who&apos;ve found their perfect
                balance.
              </p>
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <Button
                  className="w-full rounded-[2rem] bg-[#FFD166] px-10 py-7 text-lg font-bold text-slate-900 shadow-2xl shadow-[#FFD166]/20 transition-all hover:bg-[#FFD166]/90 hover:scale-105 active:scale-95 sm:w-auto"
                  asChild
                >
                  <Link href="/seeker/register">Browse New Roles</Link>
                </Button>
                <Button
                  variant="default"
                  className="w-full rounded-[2rem] border-2 border-white/20 bg-transparent px-10 py-7 text-lg font-bold text-white transition-all hover:bg-white/5 sm:w-auto"
                  asChild
                >
                  <Link href="/recruiter/register">Hire a Professional</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
