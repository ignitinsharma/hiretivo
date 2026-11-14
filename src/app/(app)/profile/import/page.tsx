import { redirect } from "next/navigation";
export default async function ProfileImportPage({ searchParams }: PageProps<"/profile/import">) {
  const { job } = await searchParams;
  const query = new URLSearchParams({ tab: "profile", importResume: "1" });
  if (typeof job === "string") query.set("job", job);
  redirect(`/resume?${query}`);
}
