import type { Metadata } from "next";
import "./globals.css";
import { SocketProvider } from "@/lib/socket";
import { Navbar } from "./components/Navbar";

export const metadata: Metadata = {
  title: "Sheeple Game",
  description:
    "A real-time multiplayer game where you try to think like the herd!",
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
      <body>
        <SocketProvider>
          <Navbar />
          <main>{children}</main>
        </SocketProvider>
      </body>
    </html>
  );
}
