"use client";
// Pole tagów w formularzu posta z autocomplete.
//
// Funkcjonalność:
//   - Lista aktualnie wybranych tagów (pille, usuwalne X-em)
//   - Input z debounced query do bazy tagów
//   - Dropdown sugestii (filtruje już wybrane)
//   - Opcja "+ Utwórz nowy tag" jeśli user ma uprawnienie tags.create
//     i wpisany tekst nie pasuje do istniejącego
//   - Hidden input "tags" z JSON.stringify(tagIds) — submitowany razem z formularzem
//
// Limit: max 5 tagów na post (heurystyka UX — zapobiega spamowi).

import { useEffect, useRef, useState } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createTag } from "@/lib/tags/actions";
import type { TagInfo } from "@/lib/tags/types";

type Props = {
  /** Tagi początkowo przypisane (dla trybu edit). */
  initialTags?: TagInfo[];
  /** Czy zalogowany user może tworzyć nowe tagi (rola ADMIN/MASTER). */
  canCreateTags: boolean;
};

const MAX_TAGS = 5;

export default function TagsField({ initialTags = [], canCreateTags }: Props) {
  const [selected, setSelected] = useState<TagInfo[]>(initialTags);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

  // Debounced fetch sugestii. Odpalamy ~250 ms po ostatnim wpisanym znaku.
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("tags")
        .select("id, name, slug, color")
        .ilike("name", `%${query.trim()}%`)
        .order("name", { ascending: true })
        .limit(8)
        .returns<TagInfo[]>();
      // Filtrujemy już wybrane.
      const selectedIds = new Set(selected.map((t) => t.id));
      setSuggestions((data ?? []).filter((t) => !selectedIds.has(t.id)));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, selected]);

  function addTag(tag: TagInfo) {
    if (selected.length >= MAX_TAGS) {
      toast.error(`Max ${MAX_TAGS} tagów na post.`);
      return;
    }
    if (selected.some((t) => t.id === tag.id)) return;
    setSelected((prev) => [...prev, tag]);
    setQuery("");
    setSuggestions([]);
  }

  function removeTag(tagId: string) {
    setSelected((prev) => prev.filter((t) => t.id !== tagId));
  }

  async function handleCreateNew() {
    const name = query.trim();
    if (!name) return;
    if (selected.length >= MAX_TAGS) {
      toast.error(`Max ${MAX_TAGS} tagów na post.`);
      return;
    }
    setIsCreating(true);
    const { tag, error } = await createTag(name);
    setIsCreating(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (tag) {
      toast.success(`Utworzono tag "${tag.name}"`);
      addTag(tag);
    }
  }

  // Czy wpisany text dokładnie odpowiada istniejącej sugestii?
  const exactMatch = suggestions.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase()
  );
  // Czy user może utworzyć nowy z wpisanego tekstu?
  const showCreateOption =
    canCreateTags && query.trim().length >= 2 && !exactMatch && !isCreating;

  return (
    <div className="tags-field" ref={wrapperRef}>
      {/* Hidden input: server action odczyta JSON tablicy ID. */}
      <input
        type="hidden"
        name="tags"
        value={JSON.stringify(selected.map((t) => t.id))}
      />

      {/* Wybrane tagi (pille) */}
      {selected.length > 0 && (
        <div className="tags-pills">
          {selected.map((tag) => (
            <span
              key={tag.id}
              className="tag-pill tag-pill-removable"
              style={{ backgroundColor: tag.color ?? "var(--color-accent)" }}
            >
              <TagIcon size={12} />
              {tag.name}
              <button
                type="button"
                className="tag-pill-remove"
                onClick={() => removeTag(tag.id)}
                aria-label={`Usuń tag ${tag.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input — disable jak osiągnięto limit */}
      {selected.length < MAX_TAGS && (
        <div className="tags-input-wrap">
          <input
            type="text"
            className="input"
            placeholder={
              selected.length === 0
                ? "Wpisz tag i wybierz z listy…"
                : "Dodaj kolejny tag…"
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions.length > 0) {
                  addTag(suggestions[0]);
                } else if (showCreateOption) {
                  handleCreateNew();
                }
              }
              if (e.key === "Escape") setIsOpen(false);
            }}
            autoComplete="off"
          />

          {isOpen && (query.trim().length > 0 || suggestions.length > 0) && (
            <div className="tags-dropdown">
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="tags-dropdown-item"
                  onClick={() => addTag(tag)}
                >
                  <span
                    className="tag-pill-dot"
                    style={{ backgroundColor: tag.color ?? "var(--color-accent)" }}
                  />
                  <span>{tag.name}</span>
                </button>
              ))}

              {showCreateOption && (
                <button
                  type="button"
                  className="tags-dropdown-item tags-dropdown-create"
                  onClick={handleCreateNew}
                  disabled={isCreating}
                >
                  <Plus size={14} />
                  <span>
                    Utwórz nowy tag: <strong>"{query.trim()}"</strong>
                  </span>
                </button>
              )}

              {suggestions.length === 0 && !showCreateOption && query.trim().length > 0 && (
                <div className="tags-dropdown-empty">
                  {canCreateTags
                    ? "Wpisz min. 2 znaki, aby utworzyć nowy tag."
                    : "Brak pasujących tagów. Nie masz uprawnień do tworzenia nowych — poproś admina."}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="field-help">
        {selected.length}/{MAX_TAGS} tagów wybranych.
        {!canCreateTags && " Możesz wybierać tylko z istniejących."}
      </div>
    </div>
  );
}
