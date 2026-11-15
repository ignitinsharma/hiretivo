import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/components/toast";
import type { JobView } from "@/lib/jobs/runner";

import { preparePosting, startAutomaticApplication } from "./actions";
import { AutomaticApplicationScreen } from "./automatic-application-screen";

vi.mock("./actions", () => ({ preparePosting: vi.fn(), startAutomaticApplication: vi.fn(), handOffToClaude: vi.fn() }));
vi.mock("@/lib/jobs/actions", () => ({ retry: vi.fn(async () => ({ ok: true, data: null })) }));
vi.mock("@/components/toast", () => ({ toast: vi.fn(), toastResult: (result: unknown) => result }));
const jobs = vi.hoisted(() => ({ listener: null as ((job: JobView<{ applicationId: string }>) => void) | null }));
vi.mock("@/hooks/use-job", () => ({ useJob: vi.fn((_id: string | null, _revision: number, onChange?: typeof jobs.listener) => { jobs.listener = onChange ?? null; return null; }) }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => null }));

const props = { aiReady: true, samplePosting: null, defaultTone: "WARM" as const };

beforeEach(() => {
  sessionStorage.clear();
  jobs.listener = null;
  router.push.mockReset();
  router.replace.mockReset();
  vi.mocked(toast).mockReset();
  vi.mocked(startAutomaticApplication).mockReset().mockResolvedValue({ ok: true, data: "job-1" });
  vi.mocked(preparePosting).mockReset().mockResolvedValue({ ok: true, data: { text: "Ledgerly needs a designer.", url: "https://jobs.example/123" } });
});

describe("automatic new application", () => {
  it("fetches a link for editing, then starts AI only after approval", async () => {
    const user = userEvent.setup();
    const onStarted = vi.fn();
    render(<AutomaticApplicationScreen {...props} onStarted={onStarted} />);
    await user.type(screen.getByLabelText("Job link or posting"), "https://jobs.example/123");
    await user.type(screen.getByLabelText("Anything I should know?"), "Highlight research");
    await user.click(screen.getByRole("button", { name: "Review posting →" }));
    expect(preparePosting).toHaveBeenCalledWith({ input: "https://jobs.example/123", sourceUrl: "" });
    expect(startAutomaticApplication).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Job description"), " Add Figma.");
    await user.click(screen.getByRole("button", { name: "Start tailoring →" }));
    expect(startAutomaticApplication).toHaveBeenCalledWith({
      input: "Ledgerly needs a designer. Add Figma.",
      sourceUrl: "https://jobs.example/123",
      tone: "WARM",
      note: "Highlight research",
      postingId: null,
      startupId: null,
    });
    expect(onStarted).toHaveBeenCalledWith("job-1");
  });

  it("opens fresh even when legacy browser drafts exist", () => {
    sessionStorage.setItem("hiretivo:automatic-application", JSON.stringify({ input: "Old posting" }));
    render(<AutomaticApplicationScreen {...props} />);
    expect(screen.getByLabelText("Job link or posting")).toHaveValue("");
    expect(screen.getByLabelText("Job link or posting")).toHaveAttribute("rows", "3");
  });
});
