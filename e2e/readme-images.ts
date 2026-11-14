import { expect, test, type Page } from "@playwright/test";

import { connectFakeGoogle, forgetGoogle, inFakeCalendar, sql } from "./support";

// The README's screenshots (see playwright.readme.config.ts): each screen as the
// demo data shows it, 1440×900 at 2×, saved over .github/images/*.png.
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

const IMAGES = ".github/images";

const POSTING = `Ledgerly: Senior Product Designer, Payments
Amsterdam (hybrid, 3 days in office) · €75,000–€90,000

What we're looking for
- 5+ years of product design
- You've built or maintained a design system
- Strong prototyping skills in Figma
- Experience with Kubernetes
- Dutch is a plus`;

/** Fonts loaded and nothing left to fetch, so no screenshot catches a fallback font. */
async function shot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${IMAGES}/${name}.png` });
}

test("the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening), Jane/ })).toBeVisible();
  await shot(page, "dashboard");
});

test("the profile", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByLabel("Full name")).toHaveValue("Jane Doe");
  await shot(page, "profile");
});

test("the base resume with its themes", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.getByRole("button", { name: "Editorial theme, in use" })).toBeVisible();
  await shot(page, "resume");
});

test("Find jobs with a posting open", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("search", { name: "Search postings" }).getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Senior Product Designer, Payments" })).toBeVisible();
  await shot(page, "find-jobs");
});

test("an application with its tailored resume and the chat", async ({ page }) => {
  const [ledgerly] = await sql<{ id: string }>(`SELECT id FROM "Application" WHERE company = 'Ledgerly' LIMIT 1`);
  await page.goto(`/applications/${ledgerly.id}`);
  await expect(page.getByRole("article", { name: "Resume" })).toContainText("Jane Doe");
  await expect(page.getByRole("log", { name: "Conversation" })).toContainText("Nothing invented");
  await shot(page, "application");
});

test.describe("the board", () => {
  test.use({ viewport: { width: 1680, height: 900 } });

  test("applications in progress", async ({ page }) => {
    await page.goto("/applications?filter=active");
    await expect(page.getByText("Kestrel Maps")).toBeVisible();
    await shot(page, "applications");
  });
});

// The dashboard on a wide window, where the calendar shows beside the
// cards, with the demo's interview and a made-up week in the fake Google;
// the account goes again afterwards. 1920×1200 at 1.5×: as many pixels as
// the others.
test.describe("the dashboard's calendar", () => {
  test.use({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1.5 });

  test("beside the cards", async ({ page }) => {
    await connectFakeGoogle(page);
    const [northstar] = await sql<{ nextInterviewAt: Date }>(`SELECT "nextInterviewAt" FROM "Application" WHERE company = 'Northstar Health'`);
    await page.goto("/");
    // The week of the demo's interview, in the browser's zone; times as ISO moments.
    const week = await page.evaluate((iso) => {
      const interview = new Date(iso);
      const monday = new Date(interview.getFullYear(), interview.getMonth(), interview.getDate() - ((interview.getDay() + 6) % 7));
      const at = (day: number, hour: number, minute = 0) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + day, hour, minute).toISOString();
      const date = (day: number) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + day).toLocaleDateString("en-CA");
      return { at: [0, 1, 2, 3, 4].map((day) => [at(day, 9, 30), at(day, 9, 45)]), lunch: [at(2, 12, 30), at(2, 13, 30)], gym: [1, 3].map((day) => [at(day, 18), at(day, 19)]), dentist: [at(4, 15), at(4, 15, 45)], review: [at(0, 14), at(0, 15)], trip: [date(5), date(7)] };
    }, northstar.nextInterviewAt.toISOString());
    const add = (summary: string, [start, end]: string[]) => inFakeCalendar("POST", undefined, { summary, start: { dateTime: start }, end: { dateTime: end } });
    for (const slot of week.at) await add("Stand-up", slot);
    for (const slot of week.gym) await add("Gym", slot);
    await add("Lunch with Sam", week.lunch);
    await add("Dentist", week.dentist);
    await add("Portfolio review", week.review);
    await inFakeCalendar("POST", undefined, { summary: "Weekend in Utrecht", start: { date: week.trip[0] }, end: { date: week.trip[1] } });

    await page.goto("/");
    await expect(page.getByRole("region", { name: "Calendar" }).getByRole("link", { name: /Interview · Lead Product Designer · Northstar Health/ })).toBeVisible();
    await shot(page, "calendar");
    await forgetGoogle();
  });
});

// Last, since it adds an application the other screens shouldn't show.
test("a new application: how you match", async ({ page }) => {
  await page.goto("/new?fresh=1");
  await page.getByLabel("Job posting").fill(POSTING);
  await page.getByRole("button", { name: "Read the posting →" }).click();
  const match = page.getByRole("heading", { name: "How you match" });
  await expect(match).toBeVisible();
  await expect(page.getByText("Experience with Kubernetes")).toBeVisible();
  // The match card at the top, with the end of the details card above it.
  await match.evaluate((heading) => {
    heading.scrollIntoView({ block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(page, "new-application");
});
