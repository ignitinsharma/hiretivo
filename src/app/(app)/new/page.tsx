import { redirect } from "next/navigation";
export default async function NewApplicationPage({ searchParams }: PageProps<"/new">) {
  const params = await searchParams;
  const query = new URLSearchParams({ newApplication: "1" });
  for (const key of ["posting", "startup"]) if (typeof params[key] === "string") query.set(key, params[key]);
  redirect(`/?${query}`);
}
