import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";
import { LogoMark } from "@/components/brand/logo";

import Image from "next/image";
import { PHOTOS } from "@/components/landing/images";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#07080c] sm:flex-row">
      <div className="relative flex-none overflow-hidden sm:flex-1">
        <div className="relative h-[220px] sm:h-full">
          <Image src={PHOTOS.poolVilla.src} alt={PHOTOS.poolVilla.alt} fill priority sizes="50vw" className="object-cover" style={{ objectPosition: PHOTOS.poolVilla.focus }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.8)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 sm:p-12">
            <div className="mb-5 flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-[19px] font-semibold tracking-[-0.03em] text-white">Housify</span>
            </div>
            <div className="max-w-[420px] text-[26px] leading-[1.1] font-bold text-white sm:text-4xl">
              Every listing, direct from the source.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#07080c] flex flex-1 items-center justify-center px-6 py-12 sm:px-6 sm:py-[100px]">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
