"use client";
// Kliencka część navbara — logo + menu + wyszukiwarka + wiadomości + dzwonek + dropdown usera.

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu, X, LogIn, UserPlus, Plus, Bell, Mail,
  User, UserCog, Shield, LogOut, FilePen,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";
import SearchBar from "@/components/search/SearchBar";

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

type Props = {
  profile: NavbarProfile;
  unreadCount: number;
  unreadMessages: number;
};

export default function NavbarClient({
  profile,
  unreadCount,
  unreadMessages,
}: Props) {
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
      <Link href="/" className="brand" aria-label="BigBlog — strona główna">
        <Image
          src="/logo.png"
          alt="BigBlog"
          width={88}
          height={88}
          priority
          className="brand-logo"
        />
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        {/* Wyszukiwarka z podpowiedziami — chowana na mobile (jest w menu) */}
        <div className="navbar-search">
          <SearchBar variant="compact" />
        </div>

        {profile ? (
          <>
            <Link href="/posty/nowy" className="btn btn-primary navbar-new-post">
              <Plus size={16} /> Nowy post
            </Link>

            {/* Wiadomości — koperta z licznikiem nieprzeczytanych */}
            <Link
              href="/wiadomosci"
              className="navbar-bell"
              aria-label={
                unreadMessages > 0
                  ? `Wiadomości (${unreadMessages} nieprzeczytanych)`
                  : "Wiadomości"
              }
            >
              <Mail size={20} />
              {unreadMessages > 0 && (
                <span className="navbar-bell-badge">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </Link>

            {/* Powiadomienia — dzwonek z licznikiem nieprzeczytanych */}
            <Link
              href="/powiadomienia"
              className="navbar-bell"
              aria-label={
                unreadCount > 0
                  ? `Powiadomienia (${unreadCount} nieprzeczytanych)`
                  : "Powiadomienia"
              }
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="navbar-bell-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
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
                    <User size={16} /> Mój profil
                  </Link>
                  <Link href="/profil/edycja" onClick={() => setUserMenuOpen(false)}>
                    <UserCog size={16} /> Edycja profilu
                  </Link>
                  <Link href="/posty/nowy" onClick={() => setUserMenuOpen(false)}>
                    <FilePen size={16} /> Nowy post
                  </Link>
                  <Link href="/wiadomosci" onClick={() => setUserMenuOpen(false)}>
                    <Mail size={16} /> Wiadomości
                    {unreadMessages > 0 && (
                      <span className="user-menu-badge">{unreadMessages}</span>
                    )}
                  </Link>
                  <Link href="/powiadomienia" onClick={() => setUserMenuOpen(false)}>
                    <Bell size={16} /> Powiadomienia
                    {unreadCount > 0 && (
                      <span className="user-menu-badge">{unreadCount}</span>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                      <Shield size={16} /> Panel admina
                    </Link>
                  )}
                  <div className="user-menu-divider"></div>
                  <form action={logout}>
                    <button type="submit" className="user-menu-logout">
                      <LogOut size={16} /> Wyloguj
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/logowanie" className="btn btn-ghost">
              <LogIn size={16} /> Logowanie
            </Link>
            <Link href="/rejestracja" className="btn btn-primary">
              <UserPlus size={16} /> Rejestracja
            </Link>
          </>
        )}

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {/* Wyszukiwarka w menu mobilnym — bez dropdownu podpowiedzi */}
          <div className="mobile-search">
            <SearchBar variant="compact" withSuggestions={false} />
          </div>

          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {profile ? (
            <>
              <Link href="/posty/nowy" onClick={() => setMenuOpen(false)}>
                <Plus size={16} /> Nowy post
              </Link>
              <Link href="/wiadomosci" onClick={() => setMenuOpen(false)}>
                <Mail size={16} /> Wiadomości
                {unreadMessages > 0 && (
                  <span className="user-menu-badge">{unreadMessages}</span>
                )}
              </Link>
              <Link href="/powiadomienia" onClick={() => setMenuOpen(false)}>
                <Bell size={16} /> Powiadomienia
                {unreadCount > 0 && (
                  <span className="user-menu-badge">{unreadCount}</span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/logowanie" onClick={() => setMenuOpen(false)}>
                <LogIn size={16} /> Logowanie
              </Link>
              <Link href="/rejestracja" onClick={() => setMenuOpen(false)}>
                <UserPlus size={16} /> Rejestracja
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
