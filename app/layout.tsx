import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ColyseusProvider } from "@/lib/colyseus/ColyseusProvider";
import { Navbar } from "./components/Navbar";
import Link from "next/link";
import { asset } from "@/lib/basePath";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sheeple: Play Herd Mentality Online Free",
    template: "%s | Sheeple",
  },
  description:
    "Sheeple is a free Herd Mentality game you can play online with friends. Everyone answers the same question and tries to match the herd. 3-12 players, in the browser, no downloads or sign-up.",
  keywords: [
    "herd mentality online",
    "play herd mentality online",
    "herd mentality game",
    "herd mentality game online free",
    "online herd mentality",
    "games like herd mentality",
    "sheeple game",
    "think like the herd",
    "online party game",
    "free multiplayer party game",
    "party game to play with friends online",
  ],
  authors: [{ name: "Sheeple Game" }],
  creator: "Sheeple Game",
  publisher: "Sheeple Game",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Sheeple Game",
    title: "Sheeple: Play Herd Mentality Online Free",
    description:
      "A free Herd Mentality style party game for 3-12 players. Answer like the herd to score. Play in the browser, no downloads.",
    images: [
      {
        // og-image.png never existed; the full logo is the closest fit.
        url: `${SITE_URL}/full_logo.png`,
        width: 1348,
        height: 777,
        alt: "Sheeple - Play Herd Mentality Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheeple: Play Herd Mentality Online Free",
    description:
      "A free Herd Mentality style party game for 3-12 players, right in the browser.",
    images: [`${SITE_URL}/full_logo.png`],
    creator: "@sheeplegame",
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "google-adsense-account": "ca-pub-9555350395401499",
  },
};

// Shared Thorstein Games bar and footer (see CLAUDE.md). The Playwright
// config sets this to "" so tests don't load it from production.
const TG_BAR_SRC =
  process.env.NEXT_PUBLIC_TG_BAR_SRC ?? "https://thorsteingames.com/tg-bar.js";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="flex flex-col min-h-screen"
        style={
          {
            "--bg-image": `url("${asset("/bg.png")}")`,
            "--sheep-image": `url("${asset("/sheep.png")}")`,
          } as React.CSSProperties
        }
      >
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Sheeple",
              alternateName: [
                "Sheeple - Herd Mentality Online",
                "Herd Mentality game online",
              ],
              description:
                "A free online party game like Herd Mentality: everyone answers the same question and scores by matching the most popular answer. 3-12 players, in the browser.",
              url: SITE_URL,
              applicationCategory: "GameApplication",
              genre: "Party game",
              operatingSystem: "Web Browser",
              isAccessibleForFree: true,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              gameItem: {
                "@type": "Game",
                name: "Sheeple",
                gamePlatform: "Web Browser",
                numberOfPlayers: {
                  "@type": "QuantitativeValue",
                  minValue: 3,
                  maxValue: 12,
                },
              },
            }),
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HE8WYT78H8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HE8WYT78H8');
          `}
        </Script>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9555350395401499"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {TG_BAR_SRC && <script src={TG_BAR_SRC} async />}
        <tg-bar game="sheeple"></tg-bar>
        <ColyseusProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <tg-footer game="sheeple">
            <Link href="/">Home</Link>
            <Link href="/how-to-play">How to Play</Link>
            <Link href="/faq">FAQ</Link>
          </tg-footer>
        </ColyseusProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
