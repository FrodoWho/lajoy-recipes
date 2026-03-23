"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Toaster, toast } from "sonner";
import type { Recipe } from "@/lib/types";
import { categoryLabels } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FavoritesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fetchFavorites = useCallback(async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_favorite", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Favorieten laden mislukt");
    } else {
      setRecipes(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleUnfavorite(recipe: Recipe) {
    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: false })
      .eq("id", recipe.id);

    if (error) {
      toast.error("Bijwerken mislukt");
    } else {
      toast.success("Verwijderd uit favorieten");
      fetchFavorites();
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar onSignOut={handleSignOut} />

      <main id="main-content" className="pt-28 pb-20 px-6 max-w-4xl mx-auto w-full flex-grow">
        {/* Simple header */}
        <header className="mb-12">
          <span className="font-label text-secondary-lajoy tracking-widest uppercase text-xs">
            Jouw opgeslagen recepten
          </span>
          <h1 className="text-4xl font-heading font-bold text-on-surface tracking-tight mt-2">
            Favorieten
          </h1>
        </header>

        {/* List */}
        {loading ? (
          <div className="text-center py-20" aria-live="polite" role="status">
            <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse" aria-hidden="true">
              favorite
            </span>
            <p className="text-on-surface-variant mt-4 font-label">Favorieten laden...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4" aria-hidden="true">
              heart_broken
            </span>
            <h2 className="text-xl font-heading font-semibold mb-2 text-on-surface">
              Nog geen favorieten
            </h2>
            <p className="text-on-surface-variant mb-6 font-label">
              Markeer een recept als favoriet om het hier te bewaren.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary font-label text-sm uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
              Bekijk recepten
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => {
              const totalTime =
                (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null;

              return (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-6 p-5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest">
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-outline-variant/40">
                          restaurant
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-heading text-lg font-bold text-on-surface truncate">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-on-surface-variant font-label text-xs uppercase tracking-wider">
                      <span>{categoryLabels[recipe.category]}</span>
                      {totalTime && (
                        <>
                          <span className="text-outline-variant">·</span>
                          <span>{totalTime} min</span>
                        </>
                      )}
                      {recipe.servings && (
                        <>
                          <span className="text-outline-variant">·</span>
                          <span>{recipe.servings} servings</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Unfavorite button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnfavorite(recipe);
                    }}
                    className="shrink-0 p-2 rounded-full hover:bg-error-container/50 transition-colors"
                    aria-label={`Remove ${recipe.title} from favorites`}
                  >
                    <span
                      className="material-symbols-outlined text-secondary-lajoy"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </button>

                  {/* Arrow */}
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors shrink-0">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
