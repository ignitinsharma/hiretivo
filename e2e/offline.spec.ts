import { expect, test } from "@playwright/test";

import { resetData } from "./support";

// Core screens work with no outbound access: nothing on load talks to the
// upstream project, a model vendor or a job source. Any request that leaves
// this machine fails the test if the app makes one.

test.beforeEach(resetData);

test("loads the main screens with every outside request blocked", async ({ page }) => {
  const outside: string[] = [];
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return route.continue();
    outside.push(url.href);
    return route.abort();
  });

  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await page.goto("/applications");
  await expect(page.locator("main")).toBeVisible();
  await page.goto("/settings?section=about");
  await expect(page.getByRole("heading", { name: "About this install" })).toBeVisible();
  await expect(page.getByText(/never sends telemetry/)).toBeVisible();

  // Give the layout's after() hooks time to run before judging.
  await page.waitForTimeout(1_000);
  expect(outside).toEqual([]);
});
