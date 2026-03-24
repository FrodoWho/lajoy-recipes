"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { categoryLabels } from "@/lib/types";
import { isSectionHeader } from "@/lib/format-text";
import { formatShoppingList, categorizeIngredients } from "@/lib/supermarket-sort";

interface FridgeItem {
  id: string;
  name: string;
  created_at: string;
}

interface RecipeMatch {
  recipe: Recipe;
  matched: string[];
  missing: string[];
  percentage: number;
  realCount: number;
}

const COMMON_STAPLES = [
  "Zout", "Zwarte peper", "Olijfolie", "Boter", "Bloem",
  "Suiker", "Eieren", "Melk", "Knoflook", "Ui",
  "Rijst", "Pasta", "Tomatenpuree", "Bouillon",
];

function normalizeIngredient(raw: string): string {
  const units = "g|gr|gram|kg|kilo|ml|l|dl|cl|oz|lb|tsp|tbsp|el|tl|eetlepel|eetlepels|theelepel|theelepels|cup|cups|snuf|snufje|bos|bosje|teen|tenen|stuk|stuks|plak|plakken|schijf|schijven|blad|blaadjes|takje|takjes|handvol|handjevol";
  const adjectives = "naar smaak|optioneel|vers|verse|gedroogd|gedroogde|gemalen|gehakt|gehakte|gesneden|in blokjes|in plakjes|in stukjes|in reepjes|fijngehakt|fijngehakte|geraspt|geraspte|bijgesneden|geplet|geschaafd|geschaafde|met vel|uitgelekt|gepureerd|grote|groot|kleine|klein|halve|half|ongezouten|gezouten|extra vierge|biologisch|biologische|roomtemperatuur|kamertemperatuur";

  return raw
    .toLowerCase()
    .replace(/[,()]/g, "")
    .replace(new RegExp(`\\b[\\d./]+\\s*(?:${units})\\b`, "gi"), "")
    .replace(/^\s*[\d./]+\s+/, "")
    .replace(new RegExp(`\\b(?:${adjectives})\\b`, "gi"), "")
    .replace(/\s+/g, " ")
    .trim();
}

function ingredientMatches(fridgeItem: string, recipeIngredient: string): boolean {
  const fridge = normalizeIngredient(fridgeItem);
  const recipe = normalizeIngredient(recipeIngredient);

  if (!fridge || !recipe) return false;
  if (recipe.includes(fridge) || fridge.includes(recipe)) return true;

  const fridgeWords = fridge.split(/\s+/).filter((w) => w.length > 2);
  const recipeWords = recipe.split(/\s+/).filter((w) => w.length > 2);

  if (fridgeWords.length > 0) {
    return fridgeWords.some((fw) =>
      recipeWords.some((rw) => rw.includes(fw) || fw.includes(rw))
    );
  }

  return false;
}

/** Check if a new item is a duplicate of something already in the fridge (fuzzy) */
function isDuplicateInFridge(newName: string, existingItems: FridgeItem[]): boolean {
  const normalized = normalizeIngredient(newName);
  if (!normalized) return false;
  return existingItems.some((item) => {
    const existing = normalizeIngredient(item.name);
    return existing === normalized || existing.includes(normalized) || normalized.includes(existing);
  });
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

export default function FridgePage() {
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [fridgeSearch, setFridgeSearch] = useState("");
  const [sortByAisle, setSortByAisle] = useState(false);
  const [fridgeDragIdx, setFridgeDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    const [fridgeRes, recipesRes] = await Promise.all([
      supabase.from("fridge_items").select("*").order("created_at", { ascending: false }),
      supabase.from("recipes").select("*").order("title"),
    ]);

    if (fridgeRes.error) {
      console.error(fridgeRes.error);
      toast.error("Koelkast laden mislukt");
    } else {
      setFridgeItems(fridgeRes.data ?? []);
    }

    if (recipesRes.error) {
      console.error(recipesRes.error);
    } else {
      setRecipes(recipesRes.data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract unique normalized ingredient names from recipes, excluding section headers
  const allRecipeIngredients = useMemo(() => {
    const seen = new Map<string, string>(); // normalized -> original
    recipes.forEach((r) => {
      r.ingredients?.forEach((ing) => {
        if (isSectionHeader(ing)) return;
        const norm = normalizeIngredient(ing);
        if (norm && !seen.has(norm)) {
          seen.set(norm, ing);
        }
      });
    });
    return Array.from(seen.values()).sort();
  }, [recipes]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    const trimmed = newItem.trim();
    if (!trimmed || trimmed.length < 2) {
      // When empty, show common staples that aren't in fridge yet
      if (showSuggestions && fridgeItems.length === 0) {
        return COMMON_STAPLES.slice(0, 8);
      }
      return [];
    }

    const query = trimmed.toLowerCase();

    // Combine recipe ingredients and common staples
    const allSuggestions = [...new Set([...allRecipeIngredients, ...COMMON_STAPLES])];

    return allSuggestions
      .filter((ing) => {
        const normalized = normalizeIngredient(ing).toLowerCase();
        const full = ing.toLowerCase();
        return (
          (full.includes(query) || normalized.includes(query)) &&
          !isDuplicateInFridge(ing, fridgeItems)
        );
      })
      .slice(0, 8);
  }, [newItem, allRecipeIngredients, fridgeItems, showSuggestions]);

  async function addItem(name?: string) {
    const raw = (name ?? newItem).trim();
    if (!raw) return;

    // Support comma-separated input: "kipfilet, olijfolie, knoflook"
    const items = raw.includes(",") ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [raw];

    let added = 0;
    let skipped = 0;

    for (const item of items) {
      if (isDuplicateInFridge(item, fridgeItems)) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("fridge_items").insert({ name: item });
      if (error) {
        console.error(error);
      } else {
        added++;
      }
    }

    if (added > 0) {
      setNewItem("");
      setShowSuggestions(false);
      fetchData();
      if (items.length > 1) {
        toast.success(`${added} ingrediënt${added !== 1 ? "en" : ""} toegevoegd${skipped > 0 ? `, ${skipped} overgeslagen (al aanwezig)` : ""}`);
      }
    } else if (skipped > 0) {
      toast.error(items.length === 1 ? "Zit al in je koelkast" : "Alle ingrediënten zitten al in je koelkast");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
      addItem(suggestions[selectedSuggestion]);
    } else {
      addItem();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from("fridge_items").delete().eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt");
    } else {
      fetchData();
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recipeMatches: RecipeMatch[] = useMemo(() => {
    if (fridgeItems.length === 0) return [];

    const fridgeNames = fridgeItems.map((item) => item.name);

    return recipes
      .filter((r) => r.ingredients?.length > 0)
      .map((recipe) => {
        const matched: string[] = [];
        const missing: string[] = [];
        const realIngredients = recipe.ingredients.filter((ing) => !isSectionHeader(ing));

        realIngredients.forEach((ing) => {
          const isMatched = fridgeNames.some((fridgeItem) =>
            ingredientMatches(fridgeItem, ing)
          );
          if (isMatched) {
            matched.push(ing);
          } else {
            missing.push(ing);
          }
        });

        const realCount = realIngredients.length;
        const percentage = realCount > 0 ? Math.round((matched.length / realCount) * 100) : 0;

        return { recipe, matched, missing, percentage, realCount };
      })
      .filter((m) => m.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }, [fridgeItems, recipes]);

  const readyToCook = recipeMatches.filter((m) => m.percentage === 100);
  const almostThere = recipeMatches.filter((m) => m.percentage > 0 && m.percentage < 100);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar onSignOut={handleSignOut} />

      <main id="main-content" className="pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto w-full flex-grow">
        <header className="mb-10 md:mb-16">
          <span className="font-label text-secondary-lajoy tracking-widest uppercase text-xs">
            Ingrediënten Tracker
          </span>
          <h1 className="text-3xl sm:text-5xl font-heading font-bold text-on-surface tracking-tight mt-2">
            Mijn Koelkast
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-lg">
            Voeg toe wat je hebt en ontdek welke recepten je nu kunt maken. Je kunt meerdere ingrediënten tegelijk toevoegen met komma&apos;s.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Fridge Items */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">kitchen</span>
                <h2 className="font-heading text-xl font-bold text-on-surface">In mijn koelkast</h2>
                {fridgeItems.length > 0 && (
                  <span className="font-label text-xs bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full font-semibold">
                    {fridgeItems.length}
                  </span>
                )}
              </div>

              {/* Add item form with autocomplete */}
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newItem}
                    onChange={(e) => {
                      setNewItem(e.target.value);
                      setShowSuggestions(true);
                      setSelectedSuggestion(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Bijv. kipfilet, olijfolie, knoflook..."
                    className="flex-grow bg-surface-container-highest border-none rounded-full py-3.5 px-5 text-sm font-label outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Ingrediënt toevoegen"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-white px-5 py-3.5 rounded-full font-label text-sm font-medium hover:opacity-90 transition-all active:scale-95 shrink-0"
                    aria-label="Toevoegen"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
                  </button>
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-20 top-full left-0 right-12 mt-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden"
                  >
                    <p className="px-4 pt-3 pb-1 font-label text-[10px] uppercase tracking-widest text-outline">
                      {newItem.trim().length < 2 ? "Veelgebruikte ingrediënten" : "Suggesties uit je recepten"}
                    </p>
                    {suggestions.map((sug, i) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => addItem(sug)}
                        onMouseEnter={() => setSelectedSuggestion(i)}
                        className={`w-full text-left px-4 py-2.5 font-label text-sm transition-colors flex items-center gap-3 ${
                          i === selectedSuggestion
                            ? "bg-primary-container/30 text-on-surface"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm text-primary/40" aria-hidden="true">
                          add_circle
                        </span>
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </form>

              {/* Items list */}
              {loading ? (
                <div className="text-center py-8" aria-live="polite" role="status">
                  <span className="material-symbols-outlined text-3xl text-primary-container animate-pulse" aria-hidden="true">kitchen</span>
                  <p className="text-on-surface-variant mt-2 text-sm font-label">Laden...</p>
                </div>
              ) : fridgeItems.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/40 mb-2" aria-hidden="true">kitchen</span>
                  <p className="text-on-surface-variant text-sm font-label">Je koelkast is leeg</p>
                  <p className="text-outline text-xs font-label mt-1">Klik op het invoerveld voor suggesties</p>
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between gap-2">
                    <p className="font-label text-xs uppercase tracking-widest text-outline shrink-0">
                      {fridgeItems.length} ingrediënt{fridgeItems.length !== 1 ? "en" : ""}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSortByAisle(!sortByAisle)}
                        className={`font-label text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors ${sortByAisle ? "text-primary" : "text-outline-variant hover:text-primary"}`}
                        title={sortByAisle ? "Sorteer op toegevoegd" : "Sorteer op gangpad"}
                      >
                        <span className="material-symbols-outlined text-xs" aria-hidden="true">sort</span>
                        {sortByAisle ? "Gangpad" : "Sorteer"}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Alle ingrediënten verwijderen?")) return;
                          for (const item of fridgeItems) {
                            await supabase.from("fridge_items").delete().eq("id", item.id);
                          }
                          fetchData();
                          toast.success("Koelkast leeggemaakt");
                        }}
                        className="font-label text-[10px] uppercase tracking-widest text-outline-variant hover:text-error-lajoy transition-colors"
                      >
                        Wissen
                      </button>
                    </div>
                  </div>

                  {fridgeItems.length > 5 && (
                    <div className="px-4 py-2 border-b border-outline-variant/10">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline-variant text-sm" aria-hidden="true">search</span>
                        <input
                          type="text"
                          value={fridgeSearch}
                          onChange={(e) => setFridgeSearch(e.target.value)}
                          placeholder="Filter..."
                          className="w-full bg-transparent border-none py-1.5 pl-8 pr-2 text-xs font-label outline-none placeholder:text-outline-variant/60"
                          aria-label="Filter ingrediënten"
                        />
                      </div>
                    </div>
                  )}

                  <div className="max-h-[500px] overflow-y-auto">
                    {(() => {
                      const filtered = fridgeItems.filter((item) =>
                        !fridgeSearch || item.name.toLowerCase().includes(fridgeSearch.toLowerCase())
                      );

                      if (filtered.length === 0 && fridgeSearch) {
                        return (
                          <p className="px-4 py-4 text-center text-xs font-label text-outline-variant">
                            Geen resultaten voor &ldquo;{fridgeSearch}&rdquo;
                          </p>
                        );
                      }

                      if (sortByAisle) {
                        const categories = categorizeIngredients(filtered.map((i) => i.name));
                        return categories.map((cat) => (
                          <div key={cat.category}>
                            <div className="px-4 py-2 bg-surface-container-high/30 border-b border-outline-variant/10">
                              <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
                                {cat.emoji} {cat.category}
                              </span>
                            </div>
                            {cat.items.map((name) => {
                              const item = filtered.find((fi) => fi.name === name);
                              if (!item) return null;
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 px-4 py-3 group hover:bg-surface-container-high/50 transition-colors border-b border-outline-variant/10"
                                >
                                  <span className="material-symbols-outlined text-sm text-primary-fixed-dim" aria-hidden="true">check_circle</span>
                                  <span className="flex-grow font-label text-sm sm:text-base text-on-surface truncate">{item.name}</span>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 rounded-full hover:bg-error-container/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                                    aria-label={`${item.name} verwijderen`}
                                  >
                                    <span className="material-symbols-outlined text-sm text-error-lajoy/70" aria-hidden="true">close</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ));
                      }

                      return filtered.map((item, i, arr) => {
                        const globalIdx = fridgeItems.indexOf(item);
                        const isDragging = fridgeDragIdx === globalIdx;
                        return (
                          <div
                            key={item.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (fridgeDragIdx !== null && fridgeDragIdx !== globalIdx) {
                                setFridgeItems(reorder(fridgeItems, fridgeDragIdx, globalIdx));
                                setFridgeDragIdx(globalIdx);
                              }
                            }}
                            className={`flex items-center gap-1 sm:gap-3 px-2 sm:px-4 py-3 group transition-all duration-150 ${
                              i < arr.length - 1 ? "border-b border-outline-variant/10" : ""
                            } ${isDragging ? "bg-primary-container/20 shadow-md ring-2 ring-primary/30 scale-[1.02] z-10 relative rounded-lg" : "hover:bg-surface-container-high/50"}`}
                          >
                            <div
                              draggable
                              onDragStart={(e) => {
                                setFridgeDragIdx(globalIdx);
                                e.dataTransfer.effectAllowed = "move";
                                const ghost = document.createElement("div");
                                ghost.style.opacity = "0";
                                ghost.style.position = "absolute";
                                ghost.style.top = "-1000px";
                                document.body.appendChild(ghost);
                                e.dataTransfer.setDragImage(ghost, 0, 0);
                                requestAnimationFrame(() => ghost.remove());
                              }}
                              onDragEnd={() => setFridgeDragIdx(null)}
                              className="hidden sm:flex items-center shrink-0 cursor-grab active:cursor-grabbing select-none p-1 rounded-md hover:bg-surface-container-high transition-colors group/handle"
                              title="Sleep om te verplaatsen"
                            >
                              <span className="material-symbols-outlined text-sm text-outline-variant/40 group-hover/handle:text-primary transition-colors" aria-hidden="true">drag_indicator</span>
                            </div>
                            <span className="material-symbols-outlined text-sm text-primary-fixed-dim" aria-hidden="true">check_circle</span>
                            <span className="flex-grow font-label text-sm sm:text-base text-on-surface truncate">{item.name}</span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 rounded-full hover:bg-error-container/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                              aria-label={`${item.name} verwijderen`}
                            >
                              <span className="material-symbols-outlined text-sm text-error-lajoy/70" aria-hidden="true">close</span>
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Recipe Matches */}
          <div className="lg:col-span-8">
            {fridgeItems.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4" aria-hidden="true">grocery</span>
                <h2 className="text-xl font-heading font-semibold mb-2 text-on-surface">
                  Voeg ingrediënten toe om te beginnen
                </h2>
                <p className="text-on-surface-variant font-label mb-6">
                  We matchen ze met je recepten en laten zien wat je kunt koken.
                </p>
                {/* Quick add common staples */}
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {COMMON_STAPLES.slice(0, 8).map((staple) => (
                    <button
                      key={staple}
                      onClick={() => addItem(staple)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label text-xs hover:bg-primary-container/30 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">add</span>
                      {staple}
                    </button>
                  ))}
                </div>
              </div>
            ) : recipeMatches.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4" aria-hidden="true">search_off</span>
                <h2 className="text-xl font-heading font-semibold mb-2 text-on-surface">
                  Geen overeenkomende recepten
                </h2>
                <p className="text-on-surface-variant font-label mb-4">
                  Geen van je recepten gebruikt deze ingrediënten. Voeg meer toe of bekijk je recepten voor inspiratie.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-primary font-label text-sm uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">menu_book</span>
                  Bekijk alle recepten
                </Link>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-primary-container/20 px-4 sm:px-6 py-4 sm:py-5 rounded-xl text-center">
                    <p className="text-3xl sm:text-4xl font-heading font-bold text-primary">{readyToCook.length}</p>
                    <p className="font-label text-xs sm:text-sm text-on-surface-variant mt-1">klaar om te koken</p>
                  </div>
                  <div className="bg-surface-container-highest px-4 sm:px-6 py-4 sm:py-5 rounded-xl text-center">
                    <p className="text-3xl sm:text-4xl font-heading font-bold text-on-surface-variant">{almostThere.length}</p>
                    <p className="font-label text-xs sm:text-sm text-on-surface-variant mt-1">bijna compleet</p>
                  </div>
                  <div className="bg-surface-container-highest px-4 sm:px-6 py-4 sm:py-5 rounded-xl text-center">
                    <p className="text-3xl sm:text-4xl font-heading font-bold text-on-surface-variant">{recipes.length - recipeMatches.length}</p>
                    <p className="font-label text-xs sm:text-sm text-on-surface-variant mt-1">geen match</p>
                  </div>
                </div>

                {/* Klaar om te koken */}
                {readyToCook.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="material-symbols-outlined text-primary" aria-hidden="true">check_circle</span>
                      <h2 className="font-heading text-2xl font-bold text-on-surface">Klaar om te Koken</h2>
                      <span className="font-label text-xs bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-semibold">{readyToCook.length}</span>
                    </div>
                    <div className="space-y-3">
                      {readyToCook.map(({ recipe, realCount }) => (
                        <Link
                          key={recipe.id}
                          href={`/recipes/${recipe.id}`}
                          className="flex items-center gap-5 p-5 rounded-xl bg-primary-container/20 hover:bg-primary-container/30 transition-all group border-2 border-primary-container/40"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-primary-container/30">
                            {recipe.image_url ? (
                              <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl text-primary/40" aria-hidden="true">restaurant</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="font-heading text-lg font-bold text-on-surface truncate">{recipe.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{categoryLabels[recipe.category]}</span>
                              <span className="text-outline-variant">·</span>
                              <span className="font-label text-xs text-primary font-semibold">Alle {realCount} ingrediënten aanwezig!</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-primary shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true">arrow_forward</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Bijna compleet */}
                {almostThere.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      <span className="material-symbols-outlined text-outline" aria-hidden="true">lock</span>
                      <h2 className="font-heading text-2xl font-bold text-on-surface">Bijna Compleet</h2>
                      <span className="font-label text-xs bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-semibold">{almostThere.length}</span>
                      <button
                        onClick={async () => {
                          const allMissing = new Set<string>();
                          almostThere.forEach(({ missing }) => missing.forEach((ing) => allMissing.add(ing)));
                          const text = formatShoppingList(`Boodschappenlijst (${allMissing.size} items)`, Array.from(allMissing));
                          if (navigator.share) {
                            try { await navigator.share({ title: "Boodschappenlijst", text }); } catch { /* cancelled */ }
                          } else {
                            await navigator.clipboard.writeText(text);
                            toast.success("Boodschappenlijst gekopieerd!");
                          }
                        }}
                        className="ml-auto font-label text-xs uppercase tracking-widest text-primary flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">share</span>
                        Deel alles
                      </button>
                    </div>
                    <div className="space-y-3">
                      {almostThere.map(({ recipe, matched, missing, percentage, realCount }) => {
                        const isExpanded = expandedRecipe === recipe.id;

                        return (
                          <div key={recipe.id} className="rounded-xl overflow-hidden border border-outline-variant/20 transition-all">
                            <button
                              onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
                              className="w-full flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-left hover:bg-surface-container-low/50 transition-colors"
                              aria-expanded={isExpanded}
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest relative">
                                {recipe.image_url ? (
                                  <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover grayscale opacity-50" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-outline-variant/40" aria-hidden="true">restaurant</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-sm text-on-surface-variant/60" aria-hidden="true">lock</span>
                                </div>
                              </div>

                              <div className="flex-grow min-w-0">
                                <h3 className="font-heading text-base sm:text-lg font-bold text-on-surface/60 truncate">{recipe.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex-grow h-2 bg-surface-container-highest rounded-full overflow-hidden max-w-48">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor:
                                          percentage >= 80 ? "#6e5d00" :
                                          percentage >= 50 ? "#dec65f" :
                                          "#cec6b2",
                                      }}
                                    />
                                  </div>
                                  <span className="font-label text-xs text-on-surface-variant font-semibold shrink-0">
                                    {matched.length}/{realCount}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`material-symbols-outlined text-outline-variant shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              >expand_more</span>
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                              <div className="overflow-hidden">
                                <div className="px-4 sm:px-5 pb-5 border-t border-outline-variant/10">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                    <div>
                                      <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-bold mb-3 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xs" aria-hidden="true">check</span>
                                        In huis ({matched.length})
                                      </p>
                                      <ul className="space-y-1.5">
                                        {matched.map((ing, i) => (
                                          <li key={i} className="text-sm text-on-surface-variant font-label flex items-start gap-2">
                                            <span className="text-primary mt-0.5" aria-hidden="true">·</span>
                                            {ing}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="font-label text-[10px] uppercase tracking-[0.15em] text-error-lajoy font-bold mb-3 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xs" aria-hidden="true">shopping_cart</span>
                                        Nog nodig ({missing.length})
                                      </p>
                                      <ul className="space-y-1.5">
                                        {missing.map((ing, i) => (
                                          <li key={i} className="text-sm text-on-surface-variant/60 font-label flex items-start gap-2">
                                            <span className="text-error-lajoy/40 mt-0.5" aria-hidden="true">·</span>
                                            {ing}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between flex-wrap gap-3">
                                    <button
                                      onClick={async () => {
                                        const text = formatShoppingList(`Boodschappenlijst voor "${recipe.title}"`, missing);
                                        if (navigator.share) {
                                          try { await navigator.share({ title: `Boodschappen: ${recipe.title}`, text }); } catch {}
                                        } else {
                                          await navigator.clipboard.writeText(text);
                                          toast.success("Boodschappenlijst gekopieerd!");
                                        }
                                      }}
                                      className="font-label text-xs uppercase tracking-widest text-primary flex items-center gap-2 hover:opacity-70 transition-opacity"
                                    >
                                      <span className="material-symbols-outlined text-sm" aria-hidden="true">share</span>
                                      Deel boodschappenlijst
                                    </button>
                                    <Link
                                      href={`/recipes/${recipe.id}`}
                                      className="font-label text-xs uppercase tracking-widest text-secondary-lajoy flex items-center gap-2 hover:opacity-70 transition-opacity"
                                    >
                                      Bekijk recept
                                      <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
