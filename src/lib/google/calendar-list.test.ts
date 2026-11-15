import { describe, expect, it, vi } from "vitest";

import { googleFetch } from "./account";
import { listWritableCalendars } from "./calendar";

vi.mock("./account", () => ({ googleFetch: vi.fn() }));
vi.mock("./endpoints", () => ({ googleUrl: (_: string, path: string) => `https://www.googleapis.com${path}` }));

describe("calendar picker choices", () => {
  it("lists every page, keeps writable calendars, and uses primary as the stable default ID", async () => {
    vi.mocked(googleFetch)
      .mockResolvedValueOnce({ items: [
        { id: "me@example.com", summary: "Personal", primary: true, accessRole: "owner" },
        { id: "read-only", summary: "Read only", accessRole: "reader" },
      ], nextPageToken: "second" })
      .mockResolvedValueOnce({ items: [
        { id: "work@example.com", summary: "Work", accessRole: "writer" },
      ] });
    expect(await listWritableCalendars()).toEqual([
      { id: "primary", name: "Personal", primary: true },
      { id: "work@example.com", name: "Work", primary: false },
    ]);
    expect(String(vi.mocked(googleFetch).mock.calls[1][1])).toContain("pageToken=second");
  });
});
