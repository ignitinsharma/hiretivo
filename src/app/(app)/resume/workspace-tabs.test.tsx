import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { settlePendingSaves } from "@/lib/pending-saves";
import { toast } from "@/components/toast";
import { WorkspaceTabs } from "./workspace-tabs";
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, useSearchParams: () => new URLSearchParams("tab=profile&section=skills&panel=sections") }));
vi.mock("@/lib/pending-saves", () => ({ settlePendingSaves: vi.fn() }));
vi.mock("@/components/toast", () => ({ toast: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(settlePendingSaves).mockResolvedValue(true); });
describe("Resume workspace navigation", () => {
  it("waits for pending saves and keeps section and panel selection", async () => {
    render(<WorkspaceTabs active="profile" />);
    await userEvent.click(screen.getByRole("link", { name: "Base resume" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/resume?section=skills&panel=sections"));
    expect(settlePendingSaves).toHaveBeenCalled();
  });
  it("keeps failed edits on screen instead of changing tabs", async () => {
    vi.mocked(settlePendingSaves).mockResolvedValue(false);
    render(<WorkspaceTabs active="profile" />);
    await userEvent.click(screen.getByRole("link", { name: "Base resume" }));
    expect(router.push).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.stringContaining("could not be saved"));
  });
});
