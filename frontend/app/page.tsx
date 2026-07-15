import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/landing/hero";
import { PathSelector } from "@/components/landing/path-selector";
import { AvailableNow } from "@/components/landing/available-now";
import { FaqAccordion } from "@/components/landing/faq-accordion";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PathSelector />
        <AvailableNow />
        <FaqAccordion />
      </main>
      <Footer />
    </>
  );
}
