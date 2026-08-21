import { fetchAndAutoClose } from "../src/services/ats-job-fetcher.service";
import { AtsSource } from "../src/constants/enums";

/*
 * Manual ATS job sync script.
 * Usage: pnpm tsx scripts/sync-ats-jobs.ts ashby|greenhouse|lever|all
 */
async function main() {
  const arg = process.argv[2] ?? "all";
  const sources =
    arg === "all"
      ? [AtsSource.ASHBY, AtsSource.GREENHOUSE, AtsSource.LEVER]
      : [arg as AtsSource];
  for (const source of sources) {
    console.log(`\n[sync] ${source} starting...`);
    const result = await fetchAndAutoClose(source as AtsSource);
    console.log(`[sync] ${source}:`, result);
  }
  console.log("\n[sync] done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[sync] failed:", err);
  process.exit(1);
});
