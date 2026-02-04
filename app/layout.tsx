import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SocketProvider } from "@/lib/socket";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Sheeple Game",
  description:
    "A real-time multiplayer game where you try to think like the herd!",
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
        <SocketProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SocketProvider>
      </body>
    </html>
  );
}
