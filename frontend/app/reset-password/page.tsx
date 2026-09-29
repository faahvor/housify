import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { PHOTOS } from "@/components/landing/images";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset your password — Housify",
  // The URL carries a one-time token: never send it to other sites in the Referer header.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col bg-[#07080c] sm:flex-row">
      <div className="relative flex-none overflow-hidden sm:flex-1">
        <div className="relative h-[200px] sm:h-full">
          <Image src={PHOTOS.mansion.src} alt={PHOTOS.mansion.alt} fill priority sizes="50vw" className="object-cover" style={{ objectPosition: PHOTOS.mansion.focus }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.85)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 sm:p-12">
            <Link href="/" className="mb-5 flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-[19px] font-semibold tracking-[-0.03em] text-white">Housify</span>
            </Link>
            <div className="max-w-[420px] text-[26px] leading-[1.1] font-bold text-white sm:text-4xl">Back into your account in a minute.</div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:py-[100px]">
        <ResetPasswordForm token={typeof token === "string" ? token : ""} />
      </div>
    </div>
  );
}
