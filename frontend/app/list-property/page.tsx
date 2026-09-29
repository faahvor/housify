import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListPropertyForm } from "./list-property-form";

export default function ListPropertyPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen px-6 pt-[170px] pb-[120px]">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-4.5 text-center text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            For Landlords
          </div>
          <h1 className="mb-[70px] text-center text-[34px] leading-[1.05] font-bold sm:text-[46px] lg:text-[60px]">
            List your property
            <br />
            <span className="text-primary">with presence.</span>
          </h1>

          <ListPropertyForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
