"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Briefcase,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarToggle } from "@/components/layout/RecruiterSidebar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/use-ui-store";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/modules/recruiter/jobs/components/PostJobModal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

const JOBS_PER_PAGE = 5;

interface JobStatItem {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
}

interface ApiJob {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  status: "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";
  createdAt: string;
  _count: { applications: number };
  skills: { skill: { id: string; name: string; category: string } }[];
}

function JobStatCard({ stat }: { stat: JobStatItem }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">
        {stat.label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900">
          {stat.value}
        </span>
        {stat.badge && (
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded border",
              stat.badgeColor,
            )}
          >
            {stat.badge}
          </span>
        )}
        {stat.label === "Talent Score Avg." && (
          <div className="w-full max-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden self-center">
            <div className="bg-primary h-full" style={{ width: "84%" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({
  job,
  onEdit,
  onToggle,
  onDeleteRequest,
}: {
  job: ApiJob;
  onEdit: (id: string) => void;
  onToggle: (id: string, newStatus: "OPEN" | "PAUSED") => void;
  onDeleteRequest: (job: ApiJob) => void;
}) {
  return (
    <tr className="hover:bg-indigo-50/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100">
            <Briefcase className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 text-sm">{job.title}</p>
              {job.status === "OPEN" && (
                <span className="text-[10px] bg-primary text-white px-1.5 rounded-sm font-bold uppercase tracking-tighter">
                  Active
                </span>
              )}
              {job.status === "PAUSED" && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded-sm font-bold uppercase tracking-tighter">
                  Archived
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {job.category ?? "General"}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="inline-block">
          <p className="font-bold text-slate-900 text-sm">
            {job._count.applications}
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-[11px] text-slate-600 font-medium">
          {new Date(job.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="px-4 py-1.5 border-indigo-200 text-indigo-700 hover:bg-primary hover:text-white text-[11px] font-bold h-auto"
          >
            View Talent
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-900"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={4}
              className="w-48 p-0 border-slate-200 rounded-xl shadow-xl ring-4 ring-black/5"
              style={{ boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px" }}
            >
              <div className="py-1.5">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => onEdit(job.id)}
                >
                  <Pencil className="w-4 h-4" />
                  Edit Job
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() =>
                    onToggle(
                      job.id,
                      job.status === "OPEN" ? "PAUSED" : "OPEN",
                    )
                  }
                >
                  <Archive className="w-4 h-4" />
                  {job.status === "OPEN" ? "Archive Job" : "Reactivate Job"}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => onDeleteRequest(job)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Job
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </td>
    </tr>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-slate-400 disabled:opacity-30"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-7 h-7 flex items-center justify-center text-slate-400 text-[11px]"
          >
            ...
          </span>
        ) : (
          <Button
            key={p}
            size="icon"
            className={cn(
              "h-7 w-7 text-[11px] font-bold shadow-sm shadow-indigo-100",
              p === currentPage
                ? "bg-primary text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
            )}
            variant={p === currentPage ? "default" : "outline"}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ),
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-slate-400 disabled:opacity-30"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}

export default function RecruiterJobsPage() {
  const queryClient = useQueryClient();
  const { openEditJobModal, openPostJobModal } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ApiJob | null>(null);

  const { data: jobs = [], isLoading } = useQuery<ApiJob[]>({
    queryKey: ["jobs"],
    queryFn: () => fetch("/api/jobs").then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "PAUSED" }) =>
      fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job updated");
    },
    onError: () => toast.error("Failed to update job"),
  });

  const totalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return jobs.slice(start, start + JOBS_PER_PAGE);
  }, [jobs, currentPage]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "OPEN").length;
  const totalApplicants = jobs.reduce(
    (sum, j) => sum + j._count.applications,
    0,
  );

  const JOB_STATS: JobStatItem[] = [
    {
      label: "Total Listings",
      value: isLoading ? "—" : String(totalJobs),
      badge: "",
      badgeColor: "",
    },
    {
      label: "Active Jobs",
      value: isLoading ? "—" : String(activeJobs),
      badge: "",
      badgeColor: "",
    },
    {
      label: "Total Applicants",
      value: isLoading ? "—" : String(totalApplicants),
      badge: "",
      badgeColor: "",
    },
    { label: "Talent Score Avg.", value: "-", badge: "", badgeColor: "" },
  ];

  const showStart = Math.min((currentPage - 1) * JOBS_PER_PAGE + 1, totalJobs);
  const showEnd = Math.min(currentPage * JOBS_PER_PAGE, totalJobs);

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10">
          <div className="flex items-start gap-4">
            <SidebarToggle className="mt-2" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  Active Jobs
                </h1>
              </div>
              <p className="text-slate-500 text-lg">
                Curate and manage your active job listings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 border-slate-200">
              <Upload className="w-4 h-4" />
              Export
            </Button>
            <Button
              className="bg-primary text-white gap-2 shadow-md shadow-indigo-100 hover:bg-primary/90"
              onClick={openPostJobModal}
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {JOB_STATS.map((stat) => (
            <JobStatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              className="w-full pl-9 bg-slate-50 border-slate-200 text-sm"
              placeholder="Quick search listings..."
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Department: All</option>
              <option>Engineering</option>
              <option>Design</option>
              <option>Finance</option>
            </select>
            <select className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Status: Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500"
            >
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary bg-indigo-50 border border-indigo-200"
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Job Details
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Applicants
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Posted Date
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-0 py-0">
                      <PageSkeleton lines={5} showHeader={false} />
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-400 text-sm"
                    >
                      No jobs posted yet. Click &quot;Post New Job&quot; to get
                      started.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      onEdit={(id) => openEditJobModal(id)}
                      onToggle={(id, status) =>
                        toggleMutation.mutate({ id, status })
                      }
                      onDeleteRequest={(j) => setDeleteTarget(j)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">
              Showing{" "}
              <span className="text-slate-900 font-bold">{showStart}</span>–
              <span className="text-slate-900 font-bold">{showEnd}</span> of{" "}
              <span className="text-slate-900 font-bold">{totalJobs}</span>{" "}
              listings
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        jobTitle={deleteTarget?.title ?? ""}
        hasApplications={(deleteTarget?._count.applications ?? 0) > 0}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
