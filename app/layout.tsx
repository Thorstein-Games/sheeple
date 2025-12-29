import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/lib/socket";

export const metadata: Metadata = {
  title: "Sheeple Game",
  description: "A real-time multiplayer game where you try to think like the herd!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          <main>{children}</main>
        </SocketProvider>
      </body>
    </html>
  );
}
