import { redirect } from "next/navigation";

export default function LegacySearchRedirect() {
  redirect("/browse");
}
