"use client";
// Pole tagów w formularzu posta — combobox z podpowiedziami.
//
// Zachowanie (faza 24):
//   - Kliknięcie / focus otwiera dropdown ze WSZYSTKIMI dostępnymi tagami
//   - Wpisanie frazy filtruje listę lokalnie (bez debounce, dane już w RAM)
//   - Opcja "+ Utwórz nowy tag" dla ADMIN/MASTER gdy fraza ≥ 2 znaki i brak dokładnego match
//   - Nowo utworzony tag trafia od razu do lokalnej listy (nie trzeba odświeżać)
//   - Wybrane tagi = pille z przyciskiem X (usuwanie)
//   - Hidden input "tags" z JSON tablicą ID — submitowany z formularzem
//   - Limit: max 5 tagów na post
//
// Poprzednie rozwiązanie (faza 10): debounced fetch po każdym wpisanym znaku,
// dropdown nie otwierał się bez wpisania tekstu.

import { useEffect, useRef, useState } from "react";
import { X, Plus, Tag as TagIcon, ChevronDown } from "lucide-react";
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
  // Wszystkie tagi ładowane raz — filtrowanie odbywa się lokalnie.
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Załaduj wszystkie tagi raz przy montowaniu komponentu.
  useEffect(() => {
    async function loadTags() {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("tags")
        .select("id, name, slug, color")
        .order("name", { ascending: true })
        .returns<TagInfo[]>();
      setAllTags(data ?? []);
      setIsLoading(false);
    }
    loadTags();
  }, []);

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

  // Filtracja lokalna — synchroniczna, bez sieciowych opóźnień.
  const selectedIds = new Set(selected.map((t) => t.id));
  const filtered = allTags.filter((t) => {
    if (selectedIds.has(t.id)) return false;
    if (!query.trim()) return true; // bez frazy → wszystkie niezmienne
    return t.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  // Czy fraza dokładnie pasuje do istniejącego tagu (case-insensitive)?
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showCreateOption =
    canCreateTags && query.trim().length >= 2 && !exactMatch && !isCreating;

  function addTag(tag: TagInfo) {
    if (selected.length >= MAX_TAGS) {
      toast.error(`Można wybrać maksymalnie ${MAX_TAGS} tagów.`);
      return;
    }
    if (selectedIds.has(tag.id)) return;
    setSelected((prev) => [...prev, tag]);
    setQuery("");
    // Zostaw dropdown otwarty — user może chcieć dodać kolejny tag.
    inputRef.current?.focus();
  }

  function removeTag(tagId: string) {
    setSelected((prev) => prev.filter((t) => t.id !== tagId));
  }

  async function handleCreateNew() {
    const name = query.trim();
    if (!name) return;
    if (selected.length >= MAX_TAGS) {
      toast.error(`Można wybrać maksymalnie ${MAX_TAGS} tagów.`);
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
      // Dopisz nowy tag do lokalnej listy (alfabetycznie) — bez przeładowania.
      setAllTags((prev) =>
        [...prev, tag].sort((a, b) => a.name.localeCompare(b.name, "pl"))
      );
      addTag(tag);
    }
  }

  return (
    <div className="tags-field" ref={wrapperRef}>
      {/* Hidden input: server action odczyta JSON tablicy ID. */}
      <input
        type="hidden"
        name="tags"
        value={JSON.stringify(selected.map((t) => t.id))}
      />

      {/* Wybrane tagi jako pille z możliwością usunięcia. */}
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

      {/* Combobox — input + dropdown. Chowany gdy osiągnięto limit. */}
      {selected.length < MAX_TAGS && (
        <div className="tags-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="input tags-combobox-input"
            placeholder={
              selected.length === 0
                ? "Wybierz lub wyszukaj tag…"
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
                if (filtered.length > 0) {
                  // Enter wybiera pierwszy pasujący tag z listy.
                  addTag(filtered[0]);
                } else if (showCreateOption) {
                  handleCreateNew();
                }
              }
              if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
              }
            }}
            autoComplete="off"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          {/* Chevron wskazuje, że to combobox — klikalny, toggleuje dropdown. */}
          <button
            type="button"
            className="tags-combobox-chevron"
            tabIndex={-1}
            aria-label="Rozwiń listę tagów"
            onMouseDown={(e) => {
              e.preventDefault(); // nie kradnij focusu z inputa
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
          >
            <ChevronDown size={16} />
          </button>

          {isOpen && (
            <div className="tags-dropdown" role="listbox">
              {isLoading ? (
                <div className="tags-dropdown-empty">Ładowanie tagów…</div>
              ) : filtered.length > 0 ? (
                filtered.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="tags-dropdown-item"
                    role="option"
                    onMouseDown={(e) => {
                      // preventDefault zapobiega utracie focusu przez input przed kliknięciem.
                      e.preventDefault();
                      addTag(tag);
                    }}
                  >
                    <span
                      className="tag-pill-dot"
                      style={{ backgroundColor: tag.color ?? "var(--color-accent)" }}
                    />
                    <span>{tag.name}</span>
                  </button>
                ))
              ) : (
                !showCreateOption && (
                  <div className="tags-dropdown-empty">
                    {query.trim()
                      ? canCreateTags
                        ? "Brak pasujących tagów. Wpisz min. 2 znaki, by utworzyć nowy."
                        : "Brak pasujących tagów."
                      : "Nie ma jeszcze żadnych tagów."}
                  </div>
                )
              )}

              {showCreateOption && (
                <button
                  type="button"
                  className="tags-dropdown-item tags-dropdown-create"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateNew();
                  }}
                  disabled={isCreating}
                >
                  <Plus size={14} />
                  <span>
                    {isCreating
                      ? "Tworzenie…"
                      : <>Utwórz nowy tag: <strong>"{query.trim()}"</strong></>}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="field-help">
        {selected.length}/{MAX_TAGS} tagów wybranych.
        {!canCreateTags && " Możesz wybierać tylko z istniejących tagów."}
      </div>
    </div>
  );
}
