import { config } from "dotenv";
config({ path: ".env.local" });
import { parseJobFromUrl, isSupportedAtsDomain } from "../../src/lib/ai/jd-parser";

async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.log("Usage: pnpm exec tsx scripts/verify/ats-url-check.ts <url1> <url2> ...");
    process.exit(1);
  }

  const results: { url: string; status: "PASS" | "FAIL"; reason?: string; title?: string; company?: string }[] = [];

  for (const url of urls) {
    process.stdout.write(`Testing: ${url.slice(0, 80)}... `);

    if (!isSupportedAtsDomain(url)) {
      console.log("SKIP (blocked: not in allowlist)");
      results.push({ url, status: "FAIL", reason: "blocked domain" });
      continue;
    }

    try {
      const job = await parseJobFromUrl(url);
      if (job) {
        console.log(`PASS — "${job.title}" at ${job.company}`);
        results.push({ url, status: "PASS", title: job.title, company: job.company });
      } else {
        console.log("FAIL (no parse result)");
        results.push({ url, status: "FAIL", reason: "parseJobFromUrl returned null" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`FAIL (${msg})`);
      results.push({ url, status: "FAIL", reason: msg });
    }
  }

  console.log("\n=== Results ===");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${passCount}, FAIL: ${failCount}\n`);

  for (const r of results) {
    const icon = r.status === "PASS" ? "✓" : "✗";
    console.log(`${icon} ${r.status === "PASS" ? r.title + " @ " + r.company : r.reason}`);
  }
}

main();
