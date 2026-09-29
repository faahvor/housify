import type { Metadata } from "next";
import { Geist, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Housify — Find home, without the middlemen",
  description:
    "Housify connects you directly with landlords, agents and realtors across Nigeria. Browse apartments, houses, land and furnished homes — no middleman stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // theme-init adds the "dark" class before hydration, so the client's
    // <html> className can legitimately differ from the server's.
    <html
      lang="en"
      className={`${sora.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var raw = localStorage.getItem('housify-session');
              var theme = raw ? JSON.parse(raw).state.theme : 'light';
              if (theme === 'dark') document.documentElement.classList.add('dark');
            } catch (e) {}
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
