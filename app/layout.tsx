import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

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

// Metadane strony — pojawiają się w karcie przeglądarki, w wynikach Google,
// w podglądach na Facebooku/X. Edycja tutaj = zmiana w całej aplikacji.
export const metadata: Metadata = {
  title: {
    default: "Tollerkowo",
    template: "%s • Tollerkowo",
  },
  description:
    "Społeczność miłośników Tollerów (Nova Scotia Duck Tolling Retriever). Dziel się przygodami, zdjęciami i radami z innymi opiekunami rasy.",
  icons: {
    icon: "/logo.png",
  },
};

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
