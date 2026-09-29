import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingView } from "./listing-view";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background px-5 pt-8 pb-24 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <ListingView id={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
