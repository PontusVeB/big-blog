"use client";
// Kliencka część navbara — dla zalogowanych dorzuca przycisk "+ Nowy post".

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth/actions";

export type NavbarProfile = {
  nickname: string | null;
  avatar_url: string | null;
  email: string;
  role: "MASTER" | "ADMIN" | "USER";
} | null;

const links = [
  { href: "/", label: "Strona główna" },
  { href: "/najnowsze", label: "Najnowsze" },
  { href: "/popularne", label: "Popularne" },
  { href: "/o-blogu", label: "O blogu" },
];

export default function NavbarClient({ profile }: { profile: NavbarProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const initial = (profile?.nickname || profile?.email || "?")[0].toUpperCase();

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const isAdmin = profile?.role === "ADMIN" || profile?.role === "MASTER";

  return (
    <nav className="navbar">
      <Link href="/" className="brand">
        <span className="brand-dot">B</span>
        <span>Big Blog</span>
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        {profile ? (
          <>
            <Link href="/posty/nowy" className="btn btn-primary navbar-new-post">
              + Nowy post
            </Link>
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="avatar"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Menu użytkownika"
                aria-expanded={userMenuOpen}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.nickname || profile.email} />
                ) : (
                  initial
                )}
              </button>
              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <div className="nick">{profile.nickname || "Bez ksywki"}</div>
                    <div className="email">{profile.email}</div>
                  </div>
                  <Link href="/profil" onClick={() => setUserMenuOpen(false)}>
                    Mój profil
                  </Link>
                  <Link href="/profil/edycja" onClick={() => setUserMenuOpen(false)}>
                    Edycja profilu
                  </Link>
                  <Link href="/posty/nowy" onClick={() => setUserMenuOpen(false)}>
                    + Nowy post
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                      Panel admina
                    </Link>
                  )}
                  <div className="user-menu-divider"></div>
                  <form action={logout}>
                    <button type="submit" className="user-menu-logout">
                      Wyloguj
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/logowanie" className="btn btn-ghost">
              Logowanie
            </Link>
            <Link href="/rejestracja" className="btn btn-primary">
              Rejestracja
            </Link>
          </>
        )}

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

      {menuOpen && (
        <div className="mobile-menu">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {profile ? (
            <Link href="/posty/nowy" onClick={() => setMenuOpen(false)}>
              + Nowy post
            </Link>
          ) : (
            <>
              <Link href="/logowanie" onClick={() => setMenuOpen(false)}>
                Logowanie
              </Link>
              <Link href="/rejestracja" onClick={() => setMenuOpen(false)}>
                Rejestracja
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
