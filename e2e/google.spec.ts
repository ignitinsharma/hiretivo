import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { fakeGoogle, resetData, sql } from "./support";

// Gmail and Calendar (E15), against the fake Google (e2e/fake-google.mts):
// entering the OAuth client in Settings, connecting, sending an application
// with its PDFs, and disconnecting.

let ledgerly = "";
test.beforeAll(async () => {
  await resetData();
  [{ id: ledgerly }] = await sql<{ id: string }>(`SELECT id FROM "Application" WHERE company = 'Ledgerly' LIMIT 1`);
  await sql(`UPDATE "Application" SET "postingText" = "postingText" || $2 WHERE id = $1`, [ledgerly, "\n\nSend your application to John Doe, careers@example.com."]);
});
// Other specs and the README captures see Google not set up.
test.afterAll(async () => {
  await sql(`DELETE FROM "GoogleAccount"`);
  await sql(`DELETE FROM "Setting" WHERE key IN ('googleClientId', 'googleClientSecretEnc')`);
});

/** No serious axe findings, in the light scheme and then the dark one. */
async function expectAccessible(page: Page) {
  for (const scheme of ["light", "dark"]) {
    await page.evaluate((chosen) => (document.documentElement.dataset.theme = chosen), scheme);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const serious = violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${scheme}: ${violation.id}: ${violation.nodes.map((node) => `${node.target.join(" ")} ${node.failureSummary ?? ""}`).join("; ")}`)).toEqual([]);
  }
  await page.evaluate(() => delete document.documentElement.dataset.theme);
}

const status = async () => (await sql<{ status: string }>(`SELECT status FROM "Application" WHERE id = $1`, [ledgerly]))[0].status;

test("connects Google, sends an application through Gmail, and disconnects", async ({ page }) => {
  // Colours change at once when the scheme does, for axe to see them settled.
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Not set up yet: Settings → Google takes the OAuth client, then connects.
  await page.goto("/settings?section=google");
  await expect(page.getByRole("link", { name: "Connect Google account" })).toBeHidden();
  await page.getByLabel("Client ID").fill("e2e-google-client.apps.googleusercontent.com");
  await page.getByLabel("Client ID").press("Enter");
  await page.getByLabel("Client secret").fill("e2e-google-secret");
  await page.getByLabel("Client secret").press("Enter");
  await expectAccessible(page);
  await page.getByRole("link", { name: "Connect Google account" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Connected as" })).toContainText("jane.doe@gmail.example");
  expect((await fakeGoogle()).granted.split(" ")).toEqual(
    expect.arrayContaining(["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/calendar.events"]),
  );
  expect((await fakeGoogle()).granted.split(" ")).not.toContain("https://www.googleapis.com/auth/gmail.readonly");
  await expectAccessible(page);

  // Sending: the email, from the account's address, with both PDFs, after a confirmation.
  await page.goto(`/applications/${ledgerly}?tab=email`);
  await page.getByRole("button", { name: "Write the email" }).click();
  await expect(page.getByRole("article", { name: "Email" }).getByRole("group", { name: "Recipient" })).toContainText("careers@example.com");
  await page.getByRole("button", { name: "Send with Gmail" }).click();
  const confirmSend = page.getByRole("alertdialog", { name: "Send this application?" });
  await expect(confirmSend).toContainText("Fromjane.doe@gmail.example");
  await expect(confirmSend).toContainText(/Attached.*Resume\.pdf, .*Cover letter\.pdf/);
  await expectAccessible(page);
  await confirmSend.getByRole("button", { name: "Send now" }).click();
  await expect(page.getByRole("button", { name: "Send again with Gmail" })).toBeVisible();
  const [application] = (await fakeGoogle()).sent;
  expect(application.raw).toMatch(/^From: Jane Doe <jane\.doe@gmail\.example>\r?$/m);
  expect(application.raw).toMatch(/^To: John Doe <careers@example\.com>\r?$/m);
  expect(application.raw).toMatch(/^Subject: Application: Senior Product Designer, Payments\r?$/m);
  expect(application.text).toMatch(/^Dear John,/);
  expect(application.attachments).toEqual([expect.stringMatching(/Resume\.pdf$/), expect.stringMatching(/Cover letter\.pdf$/)]);
  expect(await status()).toBe("SENT");

  // Disconnecting revokes Hiretivo's access at Google.
  await page.goto("/settings?section=google");
  await page.getByRole("button", { name: "Disconnect" }).click();
  await page.getByRole("alertdialog", { name: "Disconnect Google?" }).getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByRole("link", { name: "Connect Google account" })).toBeVisible();
  expect((await fakeGoogle()).revoked).toBe(1);
});
