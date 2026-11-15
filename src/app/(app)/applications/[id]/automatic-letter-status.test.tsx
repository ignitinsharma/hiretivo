import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import type { JobView } from "@/lib/jobs/runner";
import { retry } from "@/lib/jobs/actions";

import { AutomaticLetterStatus } from "./automatic-letter-status";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
const jobs = vi.hoisted(() => ({ listener: null as ((job: JobView) => void) | null }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/hooks/use-job", () => ({ useJob: vi.fn((_id: string, _revision: number, onChange: (job: JobView) => void) => { jobs.listener = onChange; return null; }) }));
vi.mock("@/lib/jobs/actions", () => ({ retry: vi.fn(async () => ({ ok: true, data: null })) }));
vi.mock("@/components/toast", () => ({ toastResult: (result: unknown) => result }));

beforeEach(() => { router.refresh.mockReset(); jobs.listener = null; vi.mocked(retry).mockClear(); });

it("keeps the resume available and retries only the missing cover letter", async () => {
  const user = userEvent.setup();
  render(<AutomaticLetterStatus job={{ id: "job-1", status: "FAILED", error: "The provider is busy." }} />);
  expect(screen.getByText("Your resume is saved")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("The provider is busy.");
  await user.click(screen.getByRole("button", { name: "Retry cover letter" }));
  expect(retry).toHaveBeenCalledWith({ id: "job-1" });
  act(() => jobs.listener?.({ id: "job-1", type: "automatic-application", status: "DONE", step: "Writing your cover letter", error: null, result: { applicationId: "app-1" } }));
  expect(router.refresh).toHaveBeenCalledOnce();
});
