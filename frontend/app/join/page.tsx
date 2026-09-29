import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { JoinForm } from "./join-form";

export default function JoinPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen px-6 pt-[170px] pb-[120px]">
        <div className="mx-auto max-w-[680px]">
          <div className="mb-4.5 text-center text-xs font-medium text-primary">
            Join Housify
          </div>
          <Suspense>
            <JoinForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
