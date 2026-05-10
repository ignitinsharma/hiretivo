import Link from "next/link";
import { HeroSearch } from "@/components/shared/HeroSearch";
import { HOMEPAGE_DISPLAY_STATS } from "@/config/home-page";

/*
 * HeroSection
 * Renders the main hero section with search functionality and popular tags.
 * Static component with no props required.
 */
export function HeroSection() {
  return (
    <section
      className="overflow-hidden px-4 pb-16 pt-20 grid-bg"
      data-purpose="hero-section"
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full mb-8">
          <span className="text-black text-sm font-bold tracking-wide">
            ✦ {HOMEPAGE_DISPLAY_STATS.heroRemoteJobs} remote jobs available
          </span>
        </div>
        <h1 className="text-foreground mb-6 text-3xl font-bold leading-tight sm:text-5xl md:text-7xl">
          <span className="text-brand-primary">Find remote work</span>{" "}
          <br />
          <span className="text-black italic">that fits your life</span>
        </h1>
        <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg md:text-2xl">
          Find your first remote job that fits your lifestyle. Thousands of
          remote-first companies hiring now. No commute required.
        </p>
        <div
          className="relative max-w-2xl mx-auto mb-8"
          data-purpose="hero-search"
        >
          <HeroSearch />
        </div>
        <div
          className="flex flex-wrap justify-center gap-3 text-sm"
          data-purpose="popular-tags"
        >
          <span className="text-muted-foreground">Popular:</span>
          <Link className="text-black font-medium hover:underline" href="#">
            React Developer
          </Link>
          <span className="text-gray-300">•</span>
          <Link className="text-black font-medium hover:underline" href="#">
            Product Designer
          </Link>
          <span className="text-gray-300">•</span>
          <Link className="text-black font-medium hover:underline" href="#">
            Sales Lead
          </Link>
          <span className="text-gray-300">•</span>
          <Link className="text-black font-medium hover:underline" href="#">
            Content Writer
          </Link>
        </div>
      </div>
    </section>
  );
}