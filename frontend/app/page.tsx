import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/landing/hero";
import { AreaMarquee, Categories } from "@/components/landing/categories";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeaturedListings } from "@/components/landing/featured-listings";
import { Areas } from "@/components/landing/areas";
import { ForProfessionals, Professionals, Trust } from "@/components/landing/professionals";
import { FaqAccordion, FinalCta } from "@/components/landing/faq-accordion";

export default function Home() {
  return (
    <>
      <Header overlay />
      <main>
        <Hero />
        <AreaMarquee />
        <Categories />
        <FeaturedListings />
        <HowItWorks />
        <Areas />
        <Professionals />
        <Trust />
        <ForProfessionals />
        <FaqAccordion />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
