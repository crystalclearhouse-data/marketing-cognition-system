import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "DiscoAgent SaaS - Build Your Bass/Disco Music Community",
  description: "Share tracks, create playlists, and connect with Discord bot integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
