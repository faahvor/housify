"use client";

import { useState } from "react";
import { FAQS } from "@/lib/mock-data";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-grid-ink relative px-6 py-[100px] sm:py-[120px]">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-16 text-center">
          <div className="mb-3.5 font-display text-[15px] italic text-gold">Questions, answered</div>
          <div className="font-display text-[30px] font-semibold text-cream sm:text-[40px] lg:text-[52px]">
            Before you begin.
          </div>
        </div>

        <div className="border-t border-gold/35">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className="border-b border-gold/35">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 py-8 text-left"
                >
                  <div className="font-display text-[19px] font-medium text-cream sm:text-2xl">
                    {faq.q}
                  </div>
                  <div className="flex-shrink-0 font-display text-2xl text-gold">
                    {isOpen ? "−" : "+"}
                  </div>
                </button>
                {isOpen && (
                  <div className="max-w-[640px] pb-9 text-[15px] leading-relaxed text-offwhite/80">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
