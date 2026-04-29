import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

// Czcionki ładowane przez Next.js next/font (auto-optymalizacja, brak CDN, brak FOUT)
// "latin-ext" jest WAŻNE — bez tego polskie znaki ą, ę, ł, ż wyglądają źle
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

// Metadane strony — pojawiają się w tytule karty przeglądarki, w wynikach Google,
// w podglądach na Facebooku/Twitterze. Edycja tutaj = zmiana w całej aplikacji.
export const metadata: Metadata = {
  title: "Big Blog",
  description: "Mój pierwszy projekt webowy — Next.js + Supabase",
};

// Główny layout aplikacji — opakowuje wszystkie podstrony nagłówkiem i stopką.
// Każda nowa podstrona (np. /posty, /profil) automatycznie dziedziczy ten layout.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
