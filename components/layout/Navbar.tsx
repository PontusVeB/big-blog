"use client";
// Navbar jest komponentem klienckim ("use client"), bo używa stanu (otwarte/zamknięte menu mobilne).

import { useState } from "react";
import Link from "next/link";

// Linki menu — dorzucanie nowych: dopisz obiekt do tej tablicy.
// Edytuj w jednym miejscu — pojawiają się i w menu desktop i mobile.
const links = [
  { href: "/", label: "Strona główna" },
  { href: "/najnowsze", label: "Najnowsze" },
  { href: "/popularne", label: "Popularne" },
  { href: "/o-blogu", label: "O blogu" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo + nazwa marki */}
      <Link href="/" className="brand">
        <span className="brand-dot">B</span>
        <span>Big Blog</span>
      </Link>

      {/* Menu desktop (chowa się na mobile przez CSS) */}
      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Akcje po prawej (login + rejestracja) */}
      <div className="navbar-right">
        <Link href="/logowanie" className="btn btn-ghost">
          Logowanie
        </Link>
        <Link href="/rejestracja" className="btn btn-primary">
          Rejestracja
        </Link>

        {/* Hamburger — widoczny tylko na mobile (sterowany CSS) */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Rozwijane menu mobile — pojawia się po kliknięciu hamburgera */}
      {menuOpen && (
        <div className="mobile-menu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/logowanie" onClick={() => setMenuOpen(false)}>
            Logowanie
          </Link>
          <Link href="/rejestracja" onClick={() => setMenuOpen(false)}>
            Rejestracja
          </Link>
        </div>
      )}
    </nav>
  );
}
