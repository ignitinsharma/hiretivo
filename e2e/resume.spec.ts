import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { resetData, sql } from "./support";

// The theme builder (E5) and the PDF download (E5-5).
test.beforeAll(resetData);

test("builds a theme, makes it the base theme and downloads the resume as a PDF", async ({ page }) => {
  await page.goto("/resume");
  await page.getByRole("button", { name: /Make your own theme/ }).click();
  await page.getByRole("radiogroup", { name: "Accent" }).getByRole("radio", { name: "Green" }).click();
  await page.getByRole("radiogroup", { name: "Spacing" }).getByRole("radio", { name: "Compact" }).click();
  await page.getByLabel("Theme name").fill("Quiet green");
  await page.getByRole("button", { name: "Save theme" }).click();
  await expect(page.getByRole("button", { name: "Quiet green theme, in use" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Quiet green theme, in use" })).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download PDF" }).click()]);
  const pdf = await readFile((await download.path())!);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  // Chromium's headless shell names every blob download "download", so the name is checked at the source.
  const response = await page.request.get("/api/pdf?doc=base");
  expect(response.headers()["content-disposition"]).toContain("filename*=UTF-8''Jane%20Doe%20%E2%80%93%20Resume.pdf");
});

test("Fit to one page downloads the resume itself, on one page (#328)", async ({ page }) => {
  const download = async () => (await (await page.request.get("/api/pdf?doc=base")).body()).toString("latin1");
  const pages = (pdf: string) => (pdf.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length;
  // The demo certification's link, which no other page has: a page count alone
  // can't tell the resume from the sign-in page, which fits on one page too.
  const link = "https://verify.example.org/IDI-20481";

  const unfitted = await download();
  expect(pages(unfitted)).toBeGreaterThan(1);
  expect(unfitted).toContain(link);

  await sql(`INSERT INTO "Setting" (key, value, "updatedAt") VALUES ('fitBaseResume', 'true', now())`);
  try {
    const fitted = await download();
    expect(pages(fitted)).toBe(1);
    expect(fitted).toContain(link);
  } finally {
    await sql(`DELETE FROM "Setting" WHERE key = 'fitBaseResume'`);
  }
});

test("keeps the summary's paragraphs, as typed in Profile → Summary (#277)", async ({ page }) => {
  const [{ value }] = await sql<{ value: string }>(`SELECT value FROM "ProfileField" WHERE key = 'summary'`);
  await sql(`UPDATE "ProfileField" SET value = $1 WHERE key = 'summary'`, ["Designs calm tools for busy teams.\n\nLeads research from the first interview to the shipped screen."]);
  try {
    await page.goto("/resume");
    const summary = page.getByText(/^Designs calm tools for busy teams\./);
    await expect(summary).toHaveCSS("white-space", "pre-line");
    // Rendered text keeps the break only where the page shows it.
    expect(await summary.evaluate((element) => (element as HTMLElement).innerText)).toContain("\n");
  } finally {
    await sql(`UPDATE "ProfileField" SET value = $1 WHERE key = 'summary'`, [value]);
  }
});

test("keeps the Resume controls and preview in place across tabs", async ({ page }) => {
  const longName = "ProfessionalDevelopmentAndCommunityLeadership".repeat(2);
  await sql(`INSERT INTO "CustomSection" (id, title, "updatedAt") VALUES ('layout-check', $1, now())`, [longName]);
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/resume?panel=sections");
    const panel = page.getByRole("complementary", { name: "Theme and sections" });
    const preview = page.getByRole("region", { name: "Resume preview" });
    const sections = panel.getByRole("tab", { name: "Sections" });
    await expect(sections).toHaveAttribute("aria-selected", "true");
    await expect(panel.getByRole("button", { name: `Remove ${longName}` })).toBeVisible();

    const position = () => panel.evaluate((controls) => {
      const grid = controls.parentElement!;
      const preview = controls.nextElementSibling!;
      const bounds = (element: Element) => {
        const { x, y, width } = element.getBoundingClientRect();
        return { x: x + window.scrollX, y: y + window.scrollY, width };
      };
      return { width: grid.clientWidth, controls: bounds(controls), preview: bounds(preview) };
    });

    for (const sidebar of ["expanded", "collapsed"]) {
      if (sidebar === "collapsed") await page.getByRole("button", { name: "Collapse sidebar" }).click();
      for (const width of [959, 960, 961]) {
        const viewport = page.viewportSize()!;
        await page.setViewportSize({ ...viewport, width: viewport.width + width - (await position()).width });
        const before = await position();
        expect(before.width).toBe(width);
        if (width < 960) {
          expect(before.controls.width).toBe(before.preview.width);
          expect(before.controls.x).toBe(before.preview.x);
          expect(before.controls.y).toBeLessThan(before.preview.y);
        } else {
          expect(before.controls.width).toBe(320);
          expect(before.preview.x).toBe(before.controls.x + 320);
          expect(before.controls.y).toBe(before.preview.y);
        }

        const themes = panel.getByRole("tab", { name: "Themes" });
        const customize = panel.getByRole("tab", { name: "Customize" });
        await themes.click();
        await expect(themes).toHaveAttribute("aria-selected", "true");
        expect(await position()).toEqual(before);
        await themes.press("ArrowRight");
        await expect(customize).toBeFocused();
        await expect(customize).toHaveAttribute("aria-selected", "true");
        expect(await position()).toEqual(before);
        await customize.press("ArrowRight");
        await expect(sections).toBeFocused();
        await expect(page).toHaveURL(/panel=sections/);
        expect(await position()).toEqual(before);
        await expect(preview.getByRole("article", { name: "Resume" })).toBeVisible();
        expect(await panel.evaluate((element) => element.scrollWidth)).toBe(await panel.evaluate((element) => element.clientWidth));
      }
    }
  } finally {
    await sql(`DELETE FROM "CustomSection" WHERE id = 'layout-check'`);
  }
});

test("uses the signed-in palette for the application dialog and preserves public colors", async ({ page, browser, baseURL }) => {
  await page.goto("/resume");
  await expect(page.getByRole("link", { name: "Download PDF" })).toHaveCSS("background-color", "rgb(12, 102, 228)");

  await page.getByRole("link", { name: "New application" }).click();
  const dialog = page.getByRole("dialog", { name: "New application" });
  await expect(dialog).toHaveCSS("border-top-color", "rgb(220, 223, 228)");
  const posting = "Example Studio is hiring a Product Designer to lead user research, prototype new features, and maintain the design system.";
  await dialog.getByRole("textbox", { name: "Job link or posting" }).fill(posting);
  const review = dialog.getByRole("button", { name: /Review posting/ });
  await expect(review).toHaveCSS("background-color", "rgb(12, 102, 228)");
  await review.click();
  await expect(dialog.getByRole("textbox", { name: "Job description" })).toHaveValue(posting);
  await dialog.getByRole("button", { name: "Close new application" }).click();
  await expect(dialog).toBeHidden();

  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: "Log in to your installation" })).toHaveCSS("background-color", "rgb(31, 61, 43)");

  const signedOut = await browser.newPage({ baseURL, storageState: { cookies: [], origins: [] } });
  try {
    await signedOut.goto("/login");
    await expect(signedOut.getByRole("button", { name: "Sign in" })).toHaveCSS("background-color", "rgb(31, 61, 43)");
  } finally {
    await signedOut.close();
  }
});
