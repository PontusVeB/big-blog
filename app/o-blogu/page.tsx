// Podstrona "O blogu" — przeniesione tu z home: hero (badge + nazwa + opis)
// oraz 3 kafelki (Rozmowy / Zdjęcia / Społeczność).

import type { Metadata } from "next";
import Link from "next/link";
import { Feather, MessageCircle, ImagePlus, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "O blogu",
  description:
    "BigBlog — wspólna przestrzeń dla autorów i czytelników. Dowiedz się, czym jest blog i co możesz tu robić.",
};

export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <span className="badge badge-warm">
          <Feather size={14} /> Blog społecznościowy
        </span>
        <h1>BigBlog</h1>
        <p>
          Wspólna przestrzeń dla autorów i czytelników. Publikuj posty, dziel
          się zdjęciami, komentuj i śledź najciekawsze treści społeczności —
          wszystko w jednym miejscu.
        </p>
      </section>

      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><MessageCircle size={24} /></div>
            <h4>Rozmowy</h4>
            <p>Pytaj, dyskutuj i wymieniaj się pomysłami z innymi autorami.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><ImagePlus size={24} /></div>
            <h4>Zdjęcia</h4>
            <p>Dodawaj zdjęcia do postów i pokazuj dokładnie to, co chcesz przekazać.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Users size={24} /></div>
            <h4>Społeczność</h4>
            <p>Poznawaj ludzi o podobnych zainteresowaniach i buduj swoją publiczność.</p>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <Link href="/" className="btn btn-primary">
          Przejdź do postów
        </Link>
      </section>
    </>
  );
}
