import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { renderResumePdf } from "@/lib/resume/render";
import { storeResumePdf } from "@/lib/resume/store";
import { mapProfileToResumeDocument } from "@/lib/resume/map-profile-to-resume";

/*
 * main
 * Builds a representative ResumeDocument via the mapper, renders it, and writes
 * ./.tmp/resume-smoke.pdf. With `--upload`, also uploads to R2 (needs R2 creds).
 * Purpose: manual ATS verification (open PDF, select-all, confirm real text).
 */
async function main(): Promise<void> {
  const doc = mapProfileToResumeDocument({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    profile: {
      headline: "Senior Backend Engineer",
      bio: "Backend engineer with 8 years building distributed systems.",
      location: "London, UK",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      topProjects: [
        { title: "OSS Scheduler", url: "https://example.com", description: "Cron for humans." },
      ],
    },
    skills: [
      { name: "Go", category: "Engineering" },
      { name: "Node.js", category: "Engineering" },
      { name: "Postgres", category: "Data" },
    ],
    experiences: [
      { company: "Analytical Engines", title: "Staff Engineer", startDate: "Jan 2020", endDate: null, isCurrent: true, description: "Led payments rewrite.\nCut p99 latency 40%." },
      { company: "Babbage Co", title: "Senior Engineer", startDate: "Jun 2016", endDate: "Dec 2019", isCurrent: false, description: "Built ingestion pipeline." },
    ],
    educations: [{ institution: "University of London", degree: "BSc", major: "Mathematics", graduationDate: "2015" }],
    certifications: [{ name: "CKA", issuer: "CNCF", issueDate: "2022" }],
  });

  const pdf = await renderResumePdf(doc);
  const out = "./.tmp/resume-smoke.pdf";
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, pdf);
  console.log(`Wrote ${out} (${pdf.length} bytes)`);

  if (process.argv.includes("--upload")) {
    const { key, url } = await storeResumePdf("smoke-seeker", pdf);
    console.log(`Uploaded to R2 key=${key}`);
    console.log(`URL: ${url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
