import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ColyseusProvider } from "@/lib/colyseus/ColyseusProvider";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://sheeple-game.com"),
  title: {
    default: "Sheeple - Online Party Game | Play Herd Mentality Online",
    template: "%s | Sheeple Game",
  },
  description:
    "Play Sheeple online free! A multiplayer party game where you think like the herd. Answer questions and match with the group to win. 3-12 players, no downloads required. Inspired by popular group thinking games.",
  keywords: [
    "sheeple game",
    "online party game",
    "multiplayer party game",
    "think like the herd",
    "group thinking game",
    "free online party game",
    "herd mentality style game",
    "question matching game",
    "virtual party game",
    "play with friends online",
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
    url: "https://sheeple-game.com",
    siteName: "Sheeple Game",
    title: "Sheeple - Think Like the Herd | Free Online Party Game",
    description:
      "Play Sheeple online free! A group thinking party game where matching with the herd wins. 3-12 players, instant play, no downloads!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sheeple - Play Herd Mentality Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheeple - Think Like the Herd Online",
    description:
      "Play Sheeple online free! Group thinking party game for 3-12 players.",
    images: ["/og-image.png"],
    creator: "@sheeplegame",
  },
  alternates: {
    canonical: "https://sheeple-game.com",
  },
  other: {
    "google-adsense-account": "ca-pub-9555350395401499",
  },
};

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
      <body className="flex flex-col min-h-screen">
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Sheeple - Group Thinking Party Game",
              description:
                "Play Sheeple online free! A multiplayer party game where you think like the herd to win. Answer questions and match with the group.",
              url: "https://sheeple-game.com",
              applicationCategory: "Game",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1247",
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
        <ColyseusProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ColyseusProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
