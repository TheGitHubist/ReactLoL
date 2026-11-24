import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Duelist Archive",
  description: "Browse Yu-Gi-Oh! cards, save favorites, and play Yugiohdle.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Duelist Archive home">
            <span className="brand-mark">遊</span>
            <span>Duelist Archive</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Card library</Link>
            <Link href="/favorites">Favorites</Link>
            <Link href="/yugiohdle">Yugiohdle</Link>
            <Link href="/profile">Duelist</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
