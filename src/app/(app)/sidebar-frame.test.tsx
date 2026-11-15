import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NavLinks } from "./nav-links";
import { SidebarFrame } from "./sidebar-frame";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/link", () => ({
  default: ({ href, ...props }: ComponentProps<"a">) => <a href={href} {...props} />,
}));

afterEach(() => {
  document.cookie = "hiretivo_sidebar=; max-age=0; path=/";
});

function renderSidebar(initialCollapsed = false) {
  return render(
    <SidebarFrame initialCollapsed={initialCollapsed} brand={<span>Hiretivo</span>}>
      <NavLinks />
    </SidebarFrame>,
  );
}

describe("SidebarFrame", () => {
  it("collapses to icons, keeps every link named, and remembers it", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(screen.getByRole("complementary")).toHaveAttribute("data-collapsed", "true");
    // The labels are only visually hidden, so links keep their names.
    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("title", "Applications");
    expect(document.cookie).toContain("hiretivo_sidebar=collapsed");

    await userEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByRole("complementary")).not.toHaveAttribute("data-collapsed");
    expect(document.cookie).toContain("hiretivo_sidebar=expanded");
  });

  it("starts collapsed when it was left that way", () => {
    renderSidebar(true);
    expect(screen.getByRole("complementary")).toHaveAttribute("data-collapsed", "true");
  });
});
