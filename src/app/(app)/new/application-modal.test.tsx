import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openApplication } from "@/lib/open-application";
import { ApplicationModal } from "./application-modal";
import { loadApplicationModal } from "./actions";
import { toast } from "@/components/toast";
import type { JobView } from "@/lib/jobs/runner";
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const jobs = vi.hoisted(() => ({ listener: null as null | ((view: JobView<{ applicationId: string }>) => void) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("./actions", () => ({ loadApplicationModal: vi.fn() }));
vi.mock("@/lib/jobs/actions", () => ({ retry: vi.fn() }));
vi.mock("@/components/toast", () => ({ toast: vi.fn() }));
vi.mock("@/hooks/use-job", () => ({ useJob: (_id: string, _revision: number, callback: typeof jobs.listener) => { jobs.listener = callback; return null; } }));
vi.mock("./automatic-application-screen", () => ({ AutomaticApplicationScreen: ({ onStarted }: { onStarted: (id: string) => void }) => <button onClick={() => onStarted("job-1")}>Start test generation</button> }));
const config = { aiReady: true, writeInClaude: false, defaultTone: "WARM" as const, activeId: null, fromPosting: null };
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); vi.mocked(loadApplicationModal).mockResolvedValue({ ok: true, data: config }); });
async function start() {
  const user = userEvent.setup();
  render(<ApplicationModal />);
  await act(async () => { openApplication(); });
  await user.click(await screen.findByText("Start test generation"));
  return user;
}
const ready: JobView<{ applicationId: string }> = { id: "job-1", type: "automatic-application", status: "RUNNING", step: "Writing your cover letter", applicationId: "app-1", error: null, result: null };
describe("shared creation modal", () => {
  it("recovers a running job without opening the dialog or changing pages", async () => {
    vi.mocked(loadApplicationModal).mockResolvedValue({ ok: true, data: { ...config, activeId: "active-job" } });
    render(<ApplicationModal />);
    expect(await screen.findByText("Preparing your application… View progress")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
  it("intercepts a selected posting link and supports Escape dismissal", async () => {
    const user = userEvent.setup();
    render(<><a href="/new?posting=posting-1">Create from posting</a><ApplicationModal /></>);
    await user.click(screen.getByText("Create from posting"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(loadApplicationModal).toHaveBeenCalledWith({ posting: "posting-1", startup: undefined });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Create from posting")).toHaveFocus();
  });

  it("opens over the current page and redirects when a visible resume becomes ready", async () => {
    await start();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => jobs.listener?.(ready));
    expect(router.push).toHaveBeenCalledWith("/applications/app-1");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("keeps closed generation in the background and notifies once without redirecting", async () => {
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Close new application" }));
    expect(screen.getByText("Preparing your application… View progress")).toBeInTheDocument();
    act(() => { jobs.listener?.(ready); jobs.listener?.(ready); });
    expect(router.push).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith("Your resume is ready", expect.objectContaining({ action: expect.objectContaining({ label: "Open application" }) }));
  });
});
