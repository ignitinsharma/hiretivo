import {
  Verified,
  Users,
  Globe,
  Calendar,
  Link as LinkIcon,
  Plus,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CompanyHeader() {
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5 sm:gap-6">
            <div className="flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl sm:text-2xl">
                AC
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Acme Corp
                </h1>
                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5">
                  <Verified className="w-4 h-4 text-black" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-black">
                    Verified
                  </span>
                </div>
              </div>
              <p className="text-base sm:text-lg text-slate-500 mt-0.5">
                Building the future of remote collaboration
              </p>

              <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>51–200 employees</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Globe className="w-4 h-4" />
                  <span>Fully Remote</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Founded 2018</span>
                </div>
                <a
                  href="#"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>acmecorp.com</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="default"
              className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-sm transition-all h-auto"
            >
              <Plus className="w-5 h-5" /> Follow
            </Button>
            <Button
              variant="default"
              className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-sm transition-all h-auto"
            >
              <Share2 className="w-5 h-5" /> Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
