import { redirect } from "next/navigation";
export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "profile" });
  if (typeof params.section === "string") query.set("section", params.section);
  redirect(`/resume?${query}`);
}
