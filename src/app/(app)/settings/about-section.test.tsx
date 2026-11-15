import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AboutSection } from "./about-section";

const facts = [
  { label: "Version", value: "0.1.0" },
  { label: "Database", value: "PostgreSQL · 9.0 MB" },
];

describe("About (SET-12)", () => {
  it("lists the install's facts", () => {
    render(<AboutSection facts={facts} />);
    expect(screen.getByRole("heading", { name: "About this install" })).toBeInTheDocument();
    expect(screen.getByText("Free and open source. No accounts, no subscriptions.")).toBeInTheDocument();
    expect(screen.getAllByRole("definition").map((value) => value.textContent)).toEqual(["0.1.0", "PostgreSQL · 9.0 MB"]);
    expect(screen.getByText("PostgreSQL · 9.0 MB")).toHaveClass("font-mono");
  });

  it("links the source, documentation and privacy page, and says nothing phones home", () => {
    render(<AboutSection facts={facts} />);
    expect(screen.getByRole("link", { name: "Source code (opens in a new tab)" })).toHaveAttribute("href", "https://github.com/ignitinsharma/hiretivo");
    expect(screen.getByRole("link", { name: "Documentation (opens in a new tab)" })).toHaveAttribute("href", "https://github.com/ignitinsharma/hiretivo#readme");
    expect(screen.getByRole("link", { name: "Privacy (opens in a new tab)" })).toHaveAttribute("href", "https://github.com/ignitinsharma/hiretivo/blob/main/PRIVACY.md");
    expect(screen.getByText(/never sends telemetry/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText(/@pm\.me/i)).not.toBeInTheDocument();
  });
});
