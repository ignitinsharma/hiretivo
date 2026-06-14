"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Briefcase,
  BarChart3,
  Pencil,
  Archive,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/use-ui-store";
import { toast } from "sonner";
import { JobStatus } from "@/constants/enums";
import { jobService } from "@/services/job.service";
import { recruiterService } from "@/services/recruiter.service";
import { ConfirmDeleteModal } from "@/modules/recruiter/jobs/components/PostJobModal";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import type { ApiJob, JobsApiResponse } from "@/services/job.service";

const JOBS_PER_PAGE = 5;

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface JobStatItem {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
  variant?: "default" | "primary";
  icon: React.ReactNode;
}

function Sparkline({ isPrimary }: { isPrimary: boolean }) {
  const strokeColor = isPrimary ? "rgba(255,255,255,0.65)" : "currentColor";
  return (
    <svg className="h-8 w-20" viewBox="0 0 80 32" fill="none">
      <path
        d="M2 24 C8 24, 12 16, 20 18 C28 20, 32 26, 40 22 C48 18, 52 10, 60 12 C68 14, 72 8, 78 6"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JobStatCard({ stat }: { stat: JobStatItem }) {
  const isPrimary = stat.variant === "primary";
  const numericValue = Number.parseInt(stat.value, 10);
  const showSparkline = !Number.isNaN(numericValue) && numericValue > 0;
  return (
    <div
      className={cn(
        "min-h-42.5 p-5 rounded-xl flex flex-col justify-between",
        isPrimary
          ? "bg-linear-to-br from-primary to-primary/80 text-white"
          : "bg-white border border-slate-200",
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            isPrimary ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
          )}
        >
          {stat.icon}
        </div>
        <p
          className={cn(
            "text-sm font-medium",
            isPrimary ? "text-white/80" : "text-slate-600",
          )}
        >
          {stat.label}
        </p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-3xl font-extrabold",
              isPrimary ? "text-white" : "text-slate-900",
            )}
          >
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
        {showSparkline ? (
          <span className={cn(isPrimary ? "text-white" : "text-slate-400")}>
            <Sparkline isPrimary={isPrimary} />
          </span>
        ) : null}
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
  onToggle: (id: string, newStatus: JobStatus.OPEN | JobStatus.PAUSED) => void;
  onDeleteRequest: (job: ApiJob) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <tr className="hover:bg-gray-50/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100">
            <Briefcase className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 text-sm">{job.title}</p>
              {job.status === JobStatus.OPEN && (
                <span className="text-[10px] bg-primary text-white px-1.5 rounded-sm font-bold uppercase tracking-tighter">
                  Active
                </span>
              )}
              {job.status === JobStatus.PAUSED && (
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
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:bg-primary hover:text-white"
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
                  onClick={() => {
                    onEdit(job.id);
                    setDropdownOpen(false);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  Edit Job
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    onToggle(
                      job.id,
                      job.status === JobStatus.OPEN
                        ? JobStatus.PAUSED
                        : JobStatus.OPEN,
                    );
                    setDropdownOpen(false);
                  }}
                >
                  <Archive className="w-4 h-4" />
                  {job.status === JobStatus.OPEN
                    ? "Archive Job"
                    : "Reactivate Job"}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    onDeleteRequest(job);
                    setDropdownOpen(false);
                  }}
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
              "h-7 w-7 text-[11px] font-bold  ",
              p === currentPage
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
            )}
            variant={p === currentPage ? "default" : "secondary"}
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
  const {
    openEditJobModal,
    openPostJobModal,
    openEmailVerificationModal,
  } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ApiJob | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(JOBS_PER_PAGE));
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter && categoryFilter !== "All")
      params.set("category", categoryFilter);
    return params.toString();
  }, [currentPage, debouncedSearch, statusFilter, categoryFilter]);

  const { data, isLoading } = useQuery<JobsApiResponse>({
    queryKey: ["jobs", queryParams],
    queryFn: () =>
      jobService.getJobs({
        page: currentPage,
        limit: JOBS_PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        category:
          categoryFilter && categoryFilter !== "All"
            ? categoryFilter
            : undefined,
      }),
    staleTime: 5 * 60_000,
  });

  const jobs = data?.jobs ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;
  const serverCategories = data?.categories ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await recruiterService.deleteJob(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-active-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-dashboard"] });
      toast.success("Job deleted");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: JobStatus.OPEN | JobStatus.PAUSED;
    }) => {
      await recruiterService.updateJobStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job updated");
    },
    onError: () => toast.error("Failed to update job"),
  });

  const JOB_STATS: JobStatItem[] = [
    {
      label: "Total Listings",
      value: isLoading ? "—" : String(stats?.totalAll ?? 0),
      badge: "",
      badgeColor: "",
      variant: "primary",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      label: "Active Jobs",
      value: isLoading ? "—" : String(stats?.activeCount ?? 0),
      badge: "",
      badgeColor: "",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      label: "Total Applicants",
      value: isLoading ? "—" : String(stats?.totalApplicants ?? 0),
      badge: "",
      badgeColor: "",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Talent Score Avg.",
      value: isLoading
        ? "—"
        : String(
            stats?.activeCount
              ? Math.round((stats?.totalApplicants ?? 0) / stats.activeCount)
              : 0,
          ),
      badge: "",
      badgeColor: "",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  const showStart = pagination
    ? Math.min((currentPage - 1) * JOBS_PER_PAGE + 1, pagination.total)
    : 0;
  const showEnd = pagination
    ? Math.min(currentPage * JOBS_PER_PAGE, pagination.total)
    : 0;

  return (
    <div className="w-full p-8">
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Department: All</option>
            {serverCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status: All</option>
            <option value={JobStatus.OPEN}>Active</option>
            <option value={JobStatus.PAUSED}>Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl ">
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
                debouncedSearch || statusFilter || categoryFilter ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-400 text-sm"
                    >
                      No jobs match your filters.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            No jobs posted yet
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Click the button below to post your first job listing.
                          </p>
                        </div>
                        <Button onClick={openPostJobModal}>
                          <Plus className="w-4 h-4" />
                          Post New Job
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              ) : (
                jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onEdit={(id) => openEditJobModal(id)}
                    onToggle={(id, status) => {
                      if (
                        status === JobStatus.OPEN &&
                        verificationStatus?.requiresVerification
                      ) {
                        openEmailVerificationModal();
                        return;
                      }
                      toggleMutation.mutate({ id, status });
                    }}
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
            <span className="text-slate-900 font-bold">
              {pagination?.total ?? 0}
            </span>{" "}
            listings
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

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
