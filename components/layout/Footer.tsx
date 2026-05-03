// Stopka — krótkie info o autorach + drobne odnośniki.

import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="brand-mini">Tollerkowo</div>
      <div className="footer-line">
        Stworzony z <Heart size={14} className="footer-heart" /> przez Piotra &amp; Kobe • {year}
      </div>
      <div className="footer-tech">Next.js · Supabase · Vercel</div>
    </footer>
  );
}
