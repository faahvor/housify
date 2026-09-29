import { redirect } from "next/navigation";

export default async function LegacyProfileRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pros/${id}`);
}
