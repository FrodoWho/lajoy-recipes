"use client";

import { useEffect, useState, useMemo, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { categoryLabels } from "@/lib/types";
import Link from "next/link";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchRecipe() {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Recept niet gevonden");
        router.push("/");
      } else {
        setRecipe(data);
      }
      setLoading(false);
    }

    fetchRecipe();
  }, [id, supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleToggleFavorite() {
    if (!recipe) return;
    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: !recipe.is_favorite })
      .eq("id", recipe.id);

    if (error) {
      toast.error("Bijwerken mislukt");
    } else {
      setRecipe({ ...recipe, is_favorite: !recipe.is_favorite });
    }
  }

  function toggleIngredient(index: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleStep(index: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <NavBar onSignOut={handleSignOut} />
        <div className="flex-grow flex items-center justify-center pt-28">
          <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse">
            skillet
          </span>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar onSignOut={handleSignOut} />

      <main id="main-content" className="pt-24 pb-20 flex-grow">
        {/* Hero Section */}
        <section className="max-w-screen-2xl mx-auto px-4 sm:px-8 mb-12 md:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <nav className="mb-8 flex items-center justify-between">
                <Link
                  href="/"
                  className="font-label text-xs uppercase tracking-[0.2em] text-secondary-lajoy flex items-center gap-2 group"
                >
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
                    arrow_back
                  </span>
                  Terug naar recepten
                </Link>
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="font-label text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Bewerken
                </Link>
              </nav>

              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-heading font-bold text-on-surface leading-[1.1] mb-8 tracking-tight">
                {recipe.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-12">
                {recipe.prep_time != null && (
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full">
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">schedule</span>
                    <span className="font-label text-sm font-medium">{recipe.prep_time} min voorbereiden</span>
                  </div>
                )}
                {recipe.cook_time != null && (
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full">
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">local_fire_department</span>
                    <span className="font-label text-sm font-medium">{recipe.cook_time} min koken</span>
                  </div>
                )}
                {recipe.servings != null && (
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full">
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">group</span>
                    <span className="font-label text-sm font-medium">{recipe.servings} porties</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-secondary-container/30 px-4 py-2 rounded-full text-secondary-lajoy">
                  <span className="font-label text-sm font-semibold uppercase tracking-wider">
                    {categoryLabels[recipe.category]}
                  </span>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full hover:bg-secondary-container/30 transition-colors"
                  aria-label={recipe.is_favorite ? "Verwijderen uit favorieten" : "Toevoegen aan favorieten"}
                >
                  <span
                    className={`material-symbols-outlined text-secondary-lajoy`}
                    style={recipe.is_favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    favorite
                  </span>
                  <span className="font-label text-sm font-medium">
                    {recipe.is_favorite ? "Favoriet" : "Favoriet"}
                  </span>
                </button>
              </div>

              {recipe.description && (
                <p className="text-xl font-sans italic text-on-surface-variant leading-relaxed max-w-xl">
                  {recipe.description}
                </p>
              )}
            </div>

            <div className="lg:col-span-5 relative">
              <div className="aspect-square md:aspect-[4/5] overflow-hidden rounded-2xl md:rounded-t-[4rem] md:rounded-bl-[4rem] shadow-2xl shadow-on-surface/5">
                {recipe.image_url ? (
                  <img
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    src={recipe.image_url}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-container via-surface-container-low to-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[120px] text-primary/20">
                      restaurant
                    </span>
                  </div>
                )}
              </div>
              {recipe.notes && (
                <div className="hidden md:block absolute -bottom-8 -left-8 bg-primary-container p-8 rounded-2xl max-w-[280px] shadow-xl">
                  <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-primary-container mb-2 block font-bold">
                    Lajoy&apos;s Tip
                  </span>
                  <p className="text-sm italic leading-relaxed text-on-primary-container">
                    &ldquo;{recipe.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recipe Content */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
          {/* Ingredients Column */}
          <aside className="md:col-span-4">
            <div className="md:sticky md:top-32 space-y-8 md:space-y-12">
              {recipe.ingredients?.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-8 flex items-center gap-3">
                    Ingrediënten
                    <span className="h-[1px] flex-grow bg-outline-variant/30" aria-hidden="true" />
                  </h2>
                  <ul className="space-y-4 font-sans text-lg">
                    {recipe.ingredients.map((ing, i) => {
                      const checked = checkedIngredients.has(i);
                      return (
                        <li
                          key={i}
                          className="flex gap-4 items-start cursor-pointer group"
                          onClick={() => toggleIngredient(i)}
                        >
                          <span
                            className={`material-symbols-outlined mt-1 transition-all shrink-0 ${
                              checked
                                ? "text-primary"
                                : "text-outline-variant group-hover:text-primary-fixed-dim"
                            }`}
                            style={checked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            aria-hidden="true"
                          >
                            {checked ? "check_circle" : "circle"}
                          </span>
                          <span className={`transition-all ${checked ? "line-through text-on-surface-variant/40" : ""}`}>
                            {ing}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {totalTime && (
                <div className="bg-surface-container-highest p-8 rounded-3xl">
                  <h3 className="font-label text-xs uppercase tracking-widest text-secondary-lajoy font-bold mb-4">
                    Totale Tijd
                  </h3>
                  <p className="text-sm font-sans italic leading-relaxed">
                    {totalTime} minuten van begin tot eind.
                    {recipe.prep_time && recipe.cook_time && (
                      <> Dat is {recipe.prep_time} min voorbereiding + {recipe.cook_time} min koken.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Preparation Column */}
          <div className="md:col-span-8 space-y-16">
            {recipe.instructions?.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-12 flex items-center gap-3">
                  Bereiding
                  <span className="h-[1px] flex-grow bg-outline-variant/30" aria-hidden="true" />
                </h2>
                <div className="space-y-12">
                  {recipe.instructions.map((step, i) => {
                    const checked = checkedSteps.has(i);
                    return (
                      <div
                        key={i}
                        className={`flex gap-6 md:gap-8 items-start cursor-pointer group transition-all ${
                          checked ? "opacity-40" : ""
                        }`}
                        onClick={() => toggleStep(i)}
                      >
                        <div className="shrink-0 flex flex-col items-center gap-2">
                          <span className={`font-heading text-3xl md:text-6xl transition-colors shrink-0 ${
                            checked ? "text-primary/30" : "text-secondary-lajoy/10 group-hover:text-secondary-lajoy/20"
                          }`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`material-symbols-outlined transition-all ${
                              checked ? "text-primary" : "text-outline-variant/30 group-hover:text-outline-variant/60"
                            }`}
                            style={checked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            aria-hidden="true"
                          >
                            {checked ? "check_circle" : "radio_button_unchecked"}
                          </span>
                        </div>
                        <div>
                          <h3 className={`font-heading text-xl font-bold mb-3 transition-all ${
                            checked ? "line-through" : ""
                          }`}>
                            Stap {i + 1}
                          </h3>
                          <p className={`text-lg leading-relaxed font-sans transition-all ${
                            checked ? "line-through text-on-surface-variant/40" : "text-on-surface-variant"
                          }`}>
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full py-10 md:py-16 mt-20 bg-surface-container-low border-t border-outline-variant/20">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-8 max-w-7xl mx-auto gap-4 sm:gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-heading italic text-on-surface text-xl">
              Lajoy&apos;s Recipes
            </span>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
              &copy; {new Date().getFullYear()}{" "}Lajoy&apos;s Recipes
            </p>
          </div>
          <a className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary-lajoy transition-all underline decoration-primary-container decoration-0 hover:decoration-2 underline-offset-8" href="mailto:support@lajoys.com">
            Ondersteuning
          </a>
        </div>
      </footer>
    </div>
  );
}
