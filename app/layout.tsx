import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Playlist Pulse — Discover Music",
  description: "Discover the best music playlists across every genre. Browse, search, and explore curated playlists powered by Spotify.",
  openGraph: {
    title: "Playlist Pulse — Discover Music",
    description: "Discover the best music playlists across every genre.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
