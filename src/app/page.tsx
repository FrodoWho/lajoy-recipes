"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { RecipeCard } from "@/components/recipe-card";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Toaster, toast } from "sonner";
import type { Recipe, RecipeCategory } from "@/lib/types";
import { categoryLabels } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

const allCategories: RecipeCategory[] = [
  "bakery",
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
  "drink",
];

const allTabs = ["all", ...allCategories];

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fetchRecipes = useCallback(async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Recepten laden mislukt");
    } else {
      setRecipes(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDelete(recipe: Recipe) {
    if (!confirm(`"${recipe.title}" verwijderen? Dit kan niet ongedaan worden.`)) return;

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipe.id);

    if (error) {
      toast.error("Recept verwijderen mislukt");
    } else {
      toast.success("Recept verwijderd");
      fetchRecipes();
    }
  }

  async function handleToggleFavorite(recipe: Recipe) {
    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: !recipe.is_favorite })
      .eq("id", recipe.id);

    if (error) {
      toast.error("Bijwerken mislukt");
    } else {
      fetchRecipes();
    }
  }

  function handleView(recipe: Recipe) {
    router.push(`/recipes/${recipe.id}`);
  }

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "all" || r.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalRecipes = recipes.length;
  const favoriteCount = recipes.filter((r) => r.is_favorite).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toaster position="top-center" richColors />

      <NavBar onSignOut={handleSignOut} />

      <main id="main-content" className="pt-28 pb-20 px-6 max-w-7xl mx-auto w-full flex-grow">
        {/* Header & Stats */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-6 md:gap-8">
          <div className="space-y-2">
            <span className="font-label text-secondary-lajoy tracking-widest uppercase text-xs">
              Jouw verzameling
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold text-on-surface tracking-tight">
              Mijn Recepten
            </h1>
          </div>
          <div className="flex flex-wrap gap-8 md:gap-12 items-center">
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-primary">{totalRecipes}</p>
              <p className="font-label text-xs uppercase tracking-widest text-outline">
                Totaal
              </p>
            </div>
            <div className="text-center border-l border-outline-variant/20 pl-8 md:pl-12">
              <p className="text-3xl font-heading font-bold text-secondary-lajoy">{favoriteCount}</p>
              <p className="font-label text-xs uppercase tracking-widest text-outline">
                Favorieten
              </p>
            </div>
            <Link
              href="/recipes/new"
              className="bg-primary text-white px-8 py-4 rounded-full font-label font-medium flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Nieuw Recept
            </Link>
          </div>
        </header>

        {/* Search (mobile) */}
        <div className="mb-8 sm:hidden">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">
              search
            </span>
            <input
              className="w-full bg-surface-container-highest rounded-full py-3 pl-10 pr-4 text-sm border-none focus:ring-2 focus:ring-primary font-label outline-none"
              placeholder="Zoek recepten..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Zoek recepten"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <nav aria-label="Recipe categories" className="mb-12 flex flex-wrap gap-3">
          {allTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`px-6 py-2 rounded-full font-label text-sm transition-colors ${
                activeTab === tab
                  ? "bg-primary-container text-on-primary-container font-semibold"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-secondary-container/30"
              }`}
            >
              {tab === "all" ? "Alles" : categoryLabels[tab as RecipeCategory]}
            </button>
          ))}
        </nav>

        {/* Recipe Grid */}
        {loading ? (
          <div className="text-center py-20" aria-live="polite" role="status">
            <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse" aria-hidden="true">
              skillet
            </span>
            <p className="text-on-surface-variant mt-4 font-label">Recepten laden...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4" aria-hidden="true">
              menu_book
            </span>
            <h2 className="text-xl font-heading font-semibold mb-2 text-on-surface">
              {recipes.length === 0 ? "Nog geen recepten!" : "Geen recepten gevonden"}
            </h2>
            <p className="text-on-surface-variant mb-6 font-label">
              {recipes.length === 0
                ? "Begin met het toevoegen van je eerste recept"
                : "Probeer een andere zoekopdracht of categorie"}
            </p>
            {recipes.length === 0 && (
              <Link
                href="/recipes/new"
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-label font-medium hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
                Eerste Recept Toevoegen
              </Link>
            )}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleView}
                featured={index === 0}
              />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
