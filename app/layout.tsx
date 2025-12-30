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
      <body>
        <SocketProvider>
          <Navbar />
          <main>{children}</main>
        </SocketProvider>
      </body>
    </html>
  );
}
