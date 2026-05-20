"use client";
// Pasek wyszukiwania z podpowiedziami "na żywo".
//
// Jak działa:
//  - input jest kontrolowany (stan `query`),
//  - ~300 ms po pauzie w pisaniu pobieramy z bazy pasujące posty (debounce),
//  - pod paskiem pokazuje się dropdown z podpowiedziami — klik wchodzi w post,
//  - to wciąż <form action="/szukaj"> — Enter prowadzi do pełnej strony wyników,
//  - dropdown ma na dole link "Pokaż wszystkie wyniki".
//
// Wariant "hero" (strona /szukaj) domyślnie NIE pokazuje podpowiedzi —
// tam i tak widać już pełne wyniki.

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildTsQuery } from "@/lib/search/utils";

type Suggestion = {
  id: string;
  title: string;
  image_url: string | null;
};

type Props = {
  variant?: "compact" | "hero";
  /** Wartość początkowa inputa (na /szukaj wstawiamy bieżącą frazę). */
  defaultValue?: string;
  autoFocus?: boolean;
  /** Czy pokazywać dropdown podpowiedzi. Domyślnie: tak dla "compact". */
  withSuggestions?: boolean;
};

const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 6;

export default function SearchBar({
  variant = "compact",
  defaultValue = "",
  autoFocus = false,
  withSuggestions,
}: Props) {
  const isHero = variant === "hero";
  const suggestionsOn = withSuggestions ?? variant === "compact";

  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Zamknięcie dropdownu po kliknięciu poza komponent.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced pobieranie podpowiedzi. Flaga `cancelled` chroni przed
  // wyścigiem — gdyby starsze zapytanie wróciło po nowszym.
  useEffect(() => {
    if (!suggestionsOn) return;

    const tsQuery = buildTsQuery(query);
    if (!tsQuery) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("id, title, image_url")
        .textSearch("search_vector", tsQuery, { config: "simple" })
        .order("created_at", { ascending: false })
        .limit(MAX_SUGGESTIONS);

      if (!cancelled) {
        setSuggestions((data ?? []) as Suggestion[]);
        setIsOpen(true);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, suggestionsOn]);

  function goToPost(id: string) {
    setIsOpen(false);
    router.push(`/posty/${id}`);
  }

  function goToResults() {
    const q = query.trim();
    if (q.length < 2) return;
    setIsOpen(false);
    router.push(`/szukaj?q=${encodeURIComponent(q)}`);
  }

  const showDropdown = suggestionsOn && isOpen && suggestions.length > 0;

  return (
    <div className="search-bar-wrap" ref={wrapperRef}>
      <form action="/szukaj" role="search" className={`search-bar search-bar-${variant}`}>
        <Search size={isHero ? 20 : 16} className="search-bar-icon" aria-hidden />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          autoFocus={autoFocus}
          autoComplete="off"
          minLength={2}
          placeholder={
            isHero ? "Szukaj postów po tytule lub treści…" : "Szukaj postów…"
          }
          aria-label="Szukaj postów"
          className="search-bar-input"
        />
        {isHero && (
          <button type="submit" className="btn btn-primary search-bar-submit">
            Szukaj
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="search-suggestions">
          {suggestions.map((post) => (
            <button
              key={post.id}
              type="button"
              className="search-suggestion"
              onClick={() => goToPost(post.id)}
            >
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt=""
                  className="search-suggestion-thumb"
                />
              ) : (
                <span className="search-suggestion-thumb search-suggestion-thumb-empty">
                  <FileText size={14} />
                </span>
              )}
              <span className="search-suggestion-title">{post.title}</span>
            </button>
          ))}
          <button
            type="button"
            className="search-suggestions-footer"
            onClick={goToResults}
          >
            Pokaż wszystkie wyniki dla „{query.trim()}"
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
