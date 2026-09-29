import { redirect } from "next/navigation";

export default function BecomeAgentRedirect() {
  redirect("/join?role=agent");
}
