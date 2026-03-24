"use client";

import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { categoryLabels } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onClick: (recipe: Recipe) => void;
  featured?: boolean;
}

export function RecipeCard({
  recipe,
  onDelete,
  onToggleFavorite,
  onClick,
  featured,
}: RecipeCardProps) {
  const router = useRouter();
  const totalTime =
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) + (recipe.fermentation_time ?? 0) || null;

  function formatTime(minutes: number): string {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes}m`;
  }

  if (featured) {
    return (
      <article
        className="lg:col-span-2 lg:row-span-1 group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl flex flex-col"
        onClick={() => onClick(recipe)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(recipe);
          }
        }}
        tabIndex={0}
        role="article"
        aria-label={`Recipe: ${recipe.title}`}
      >
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low transition-all duration-500 min-h-72 max-h-96">
          {recipe.image_url ? (
            <img
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={recipe.image_url}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-container via-surface-container-low to-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-8xl text-primary/20">
                restaurant
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-primary-container/90 text-on-surface px-3 py-1 rounded-full text-xs font-label uppercase tracking-widest">
                Uitgelicht
              </span>
              {totalTime && (
                <span className="text-xs font-label uppercase tracking-widest opacity-80">
                  {formatTime(totalTime)}
                  {recipe.servings ? ` · ${recipe.servings} Porties` : ""}
                </span>
              )}
            </div>
            <h2 className="text-4xl font-heading font-bold mb-2">{recipe.title}</h2>
            {recipe.description && (
              <p className="font-sans italic text-white/80 max-w-md line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
          {/* Favorite button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-surface/80 glass-nav hover:bg-surface transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe);
            }}
            aria-label={recipe.is_favorite ? "Verwijderen uit favorieten" : "Toevoegen aan favorieten"}
          >
            <span
              className={`material-symbols-outlined text-secondary-lajoy ${
                recipe.is_favorite ? "" : "opacity-40"
              }`}
              style={recipe.is_favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              favorite
            </span>
          </button>
          {/* Actions */}
          <div className="absolute top-4 right-16 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              className="p-2 rounded-full bg-surface/80 glass-nav hover:bg-surface transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/recipes/${recipe.id}/edit`);
              }}
              aria-label="Recept bewerken"
            >
              <span className="material-symbols-outlined text-sm text-on-surface" aria-hidden="true">edit</span>
            </button>
            <button
              className="p-2 rounded-full bg-surface/80 glass-nav hover:bg-error-container transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recipe);
              }}
              aria-label="Recept verwijderen"
            >
              <span className="material-symbols-outlined text-sm text-error-lajoy" aria-hidden="true">delete</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="bg-surface-container-low rounded-xl overflow-hidden group hover:shadow-xl hover:shadow-secondary-lajoy/5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex flex-col min-h-72 max-h-96"
      onClick={() => onClick(recipe)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(recipe);
        }
      }}
      tabIndex={0}
      role="article"
      aria-label={`Recipe: ${recipe.title}`}
    >
      <div className="h-64 overflow-hidden relative">
        {recipe.image_url ? (
          <img
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            src={recipe.image_url}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-container-highest to-surface-container-low flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-6xl text-outline-variant/50">
              restaurant
            </span>
          </div>
        )}
        {/* Favorite button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-surface/80 glass-nav hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(recipe);
          }}
          aria-label={recipe.is_favorite ? "Verwijderen uit favorieten" : "Toevoegen aan favorieten"}
        >
          <span
            className={`material-symbols-outlined text-secondary-lajoy ${
              recipe.is_favorite ? "" : "opacity-40"
            }`}
            style={recipe.is_favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            favorite
          </span>
        </button>
        {/* Always show filled heart if favorited */}
        {recipe.is_favorite && (
          <span
            className="absolute top-3 right-3 p-1.5 material-symbols-outlined text-secondary-lajoy group-hover:hidden"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
        )}
        {/* Edit/Delete on hover */}
        <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            className="p-1.5 rounded-full bg-surface/80 glass-nav hover:bg-surface transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/recipes/${recipe.id}/edit`);
            }}
            aria-label="Recept bewerken"
          >
            <span className="material-symbols-outlined text-sm text-on-surface" aria-hidden="true">edit</span>
          </button>
          <button
            className="p-1.5 rounded-full bg-surface/80 glass-nav hover:bg-error-container transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recipe);
            }}
            aria-label="Recept verwijderen"
          >
            <span className="material-symbols-outlined text-sm text-error-lajoy" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className="font-label text-xs uppercase tracking-widest text-secondary-lajoy font-semibold">
            {categoryLabels[recipe.category]}
          </span>
        </div>
        <h3 className="text-2xl font-heading font-bold text-on-surface mb-2">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 mb-3 font-sans">
            {recipe.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-outline font-label text-xs uppercase tracking-tighter">
          {totalTime && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
              {formatTime(totalTime)}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">group</span>
              {recipe.servings}
            </span>
          )}
          {recipe.ingredients?.length > 0 && (
            <span>{recipe.ingredients.length} ingrediënten</span>
          )}
        </div>
      </div>
    </article>
  );
}
