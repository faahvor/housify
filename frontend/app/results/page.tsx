import { redirect } from "next/navigation";

export default async function LegacyResultsRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = new URLSearchParams();
  if (sp.path === "rent") next.set("type", "rent");
  if (sp.path === "buy") next.set("type", "sale");
  if (sp.location) next.set("location", sp.location.replace(/, Nigeria$/, ""));
  redirect(`/browse?${next}`);
}
