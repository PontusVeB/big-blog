import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
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
        {/* Toaster od sonnera — system powiadomień typu "toast" w dolnym rogu.
            Wyświetla się dla każdego toast.* z dowolnego komponentu. */}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "app-toast",
            },
          }}
        />
      </body>
    </html>
  );
}
