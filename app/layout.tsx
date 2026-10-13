import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Playfair_Display,
  Space_Grotesk,
  Lora,
  JetBrains_Mono,
} from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Waku — Your identity, beautifully put together.",
    template: "%s · Waku",
  },
  description:
    "Build a beautiful personal profile page and a matching shareable identity card. AI-written bios, live theming, and instant PNG export.",
  applicationName: "Waku",
  manifest: "/site.webmanifest",
  keywords: [
    "personal website",
    "profile page",
    "link in bio",
    "identity card",
    "developer portfolio",
    "AI bio generator",
  ],
  openGraph: {
    title: "Waku — Your identity, beautifully put together.",
    description:
      "Build a beautiful personal profile page and a matching shareable identity card.",
    type: "website",
    siteName: "Waku",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waku — Your identity, beautifully put together.",
    description:
      "Build a beautiful personal profile page and a matching shareable identity card.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
