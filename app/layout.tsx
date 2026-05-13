import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToastFlash from "@/components/shared/ToastFlash";
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

        {/* Toaster — kontener wyświetlający wszystkie toasty (lewy dolny róg) */}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ classNames: { toast: "app-toast" } }}
        />

        {/* Flash toasty z URL params (po przekierowaniach z Server Actions).
            Suspense wymagane bo useSearchParams() jest CSR-only w Next.js 15+. */}
        <Suspense fallback={null}>
          <ToastFlash />
        </Suspense>
      </body>
    </html>
  );
}
