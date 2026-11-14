import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobView } from "@/lib/jobs/runner";
import { toast } from "@/components/toast";
import { loadImportModal } from "./modal-actions";
import { ImportResumeModal } from "./import-modal";
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
const job = vi.hoisted(() => ({ listener: null as null | ((view: JobView) => void) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("./modal-actions", () => ({ loadImportModal: vi.fn() }));
vi.mock("@/components/toast", () => ({ toast: vi.fn() }));
vi.mock("@/hooks/use-job", () => ({ useJob: (_id: string, _revision: number, listener: typeof job.listener) => { job.listener = listener; return null; } }));
vi.mock("./profile-import", () => ({ ProfileImport: ({ initialJobId, onApplied }: { initialJobId: string | null; onApplied: () => void }) => <><p>{initialJobId ? "Pending review" : "Choose resume"}</p><button onClick={onApplied}>Apply test import</button></> }));
const config = { aiReady: true, provider: "LOCAL" as const, keptFor: "24 hours", initialJobId: null as string | null, unavailable: false };
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); history.replaceState(null, "", "/resume"); vi.mocked(loadImportModal).mockResolvedValue({ ok: true, data: config }); });
describe("shared import dialog", () => {
  it("opens from an import link and supports Escape with restored focus", async () => {
    const user = userEvent.setup();
    render(<><a href="/profile/import">Import resume</a><ImportResumeModal /></>);
    await user.click(screen.getByText("Import resume"));
    expect(await screen.findByText("Choose resume")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Import resume")).toHaveFocus();
  });
  it("recovers pending review without opening the modal and notifies once", async () => {
    vi.mocked(loadImportModal).mockResolvedValue({ ok: true, data: { ...config, initialJobId: "import-1" } });
    render(<ImportResumeModal />);
    expect(await screen.findByText("Reading resume… View progress")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => { job.listener?.({ id: "import-1", type: "import-profile", status: "DONE", step: null, error: null, result: {} }); job.listener?.({ id: "import-1", type: "import-profile", status: "DONE", step: null, error: null, result: {} }); });
    expect(toast).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });
  it("keeps the Profile tab after applying and refreshes workspace data", async () => {
    history.replaceState(null, "", "/resume?tab=profile&section=skills");
    const user = userEvent.setup();
    render(<><a href="/profile/import">Import resume</a><ImportResumeModal /></>);
    await user.click(screen.getByText("Import resume"));
    await user.click(await screen.findByText("Apply test import"));
    expect(router.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/resume\?tab=profile&section=skills&imported=/), { scroll: false });
    expect(router.refresh).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
