import { apiClient } from "@/lib/axios";
import type { AdminJobDetail, AdminJobListItem, CompanySuggestion } from "../types/admin-job.types";
import type { AdminJobCreateInput, AdminJobUpdateInput } from "@/lib/validations/admin-job.schema";

/*
 * adminJobService
 * Axios-based client for the admin job upload feature.
 * All endpoints are prefixed under /admin/ and require an admin session
 * (gated server-side via middleware). The apiClient baseURL is /api, so
 * paths here omit the /api prefix entirely.
 */
export const adminJobService = {
  /*
   * list
   * Fetches the admin job list with an optional status filter.
   * GET /api/admin/jobs?status=<status>
   * Returns: { jobs: AdminJobListItem[] }
   */
  list: async (status?: string): Promise<{ jobs: AdminJobListItem[] }> => {
    const { data } = await apiClient.get<{ jobs: AdminJobListItem[] }>(
      "/admin/jobs",
      { params: status ? { status } : undefined },
    );
    return data;
  },

  /*
   * get
   * Fetches a single admin job by ID.
   * GET /api/admin/jobs/[id]
   * Returns: { job: AdminJobDetail }
   */
  get: async (id: string): Promise<{ job: AdminJobDetail }> => {
    const { data } = await apiClient.get<{ job: AdminJobDetail }>(`/admin/jobs/${id}`);
    return data;
  },

  /*
   * create
   * Creates a new admin-posted job.
   * POST /api/admin/jobs
   * Body: AdminJobCreateInput
   * Returns: { job: AdminJobDetail }
   */
  create: async (payload: AdminJobCreateInput): Promise<{ job: AdminJobDetail }> => {
    const { data } = await apiClient.post<{ job: AdminJobDetail }>("/admin/jobs", payload);
    return data;
  },

  /*
   * update
   * Partially updates an existing admin job (PATCH semantics).
   * PATCH /api/admin/jobs/[id]
   * Body: AdminJobUpdateInput (all fields optional)
   * Returns: { job: AdminJobDetail }
   */
  update: async (id: string, payload: AdminJobUpdateInput): Promise<{ job: AdminJobDetail }> => {
    const { data } = await apiClient.patch<{ job: AdminJobDetail }>(
      `/admin/jobs/${id}`,
      payload,
    );
    return data;
  },

  /*
   * remove
   * Soft-deletes an admin job.
   * DELETE /api/admin/jobs/[id]
   * Returns: { ok: true }
   */
  remove: async (id: string): Promise<{ ok: true }> => {
    const { data } = await apiClient.delete<{ ok: true }>(`/admin/jobs/${id}`);
    return data;
  },

  /*
   * publish
   * Transitions an admin job from DRAFT to OPEN (published).
   * POST /api/admin/jobs/[id]/publish
   * Returns: { job: AdminJobDetail }
   */
  publish: async (id: string): Promise<{ job: AdminJobDetail }> => {
    const { data } = await apiClient.post<{ job: AdminJobDetail }>(
      `/admin/jobs/${id}/publish`,
    );
    return data;
  },

  /*
   * suggestCompanies
   * Company name autocomplete for the job form.
   * GET /api/admin/companies/suggest?q=<query>
   * Returns: { companies: CompanySuggestion[] }
   */
  suggestCompanies: async (q: string): Promise<{ companies: CompanySuggestion[] }> => {
    const { data } = await apiClient.get<{ companies: CompanySuggestion[] }>(
      "/admin/companies/suggest",
      { params: { q } },
    );
    return data;
  },
};
