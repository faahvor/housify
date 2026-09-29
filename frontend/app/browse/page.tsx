import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrowseView } from "./browse-view";

export const metadata: Metadata = {
  title: "Browse homes — Housify",
  description: "Search homes to rent and buy across Lagos, Abuja and Port Harcourt, listed directly by landlords, agents and realtors.",
};

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Reading searchParams renders this page per request, so BrowseView's useSearchParams
  // needs no <Suspense> boundary. Without one, it hydrates with the rest of the page.
  await searchParams;
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background px-5 pt-10 pb-24 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <BrowseView />
        </div>
      </main>
      <Footer />
    </>
  );
}
