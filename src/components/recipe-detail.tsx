"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Recipe } from "@/lib/types";
import { categoryLabels } from "@/lib/types";

interface RecipeDetailProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetail({ recipe, open, onOpenChange }: RecipeDetailProps) {
  if (!recipe) return null;

  const totalTime =
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-surface">
        <SheetHeader className="text-left">
          <span className="font-label text-xs uppercase tracking-widest text-secondary-lajoy font-semibold mb-1">
            {categoryLabels[recipe.category]}
          </span>
          <SheetTitle className="text-2xl font-heading">{recipe.title}</SheetTitle>
          {recipe.description && (
            <p className="text-on-surface-variant font-sans italic">{recipe.description}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Quick info */}
          <div className="flex gap-6 text-sm font-label">
            {recipe.prep_time != null && (
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                <span>
                  <strong className="text-on-surface">Prep:</strong> {recipe.prep_time} min
                </span>
              </div>
            )}
            {recipe.cook_time != null && (
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary-lajoy">local_fire_department</span>
                <span>
                  <strong className="text-on-surface">Cook:</strong> {recipe.cook_time} min
                </span>
              </div>
            )}
            {totalTime && (
              <div className="text-outline">
                Total: {totalTime} min
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">group</span>
                <span>{recipe.servings} servings</span>
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant/20" />

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div>
              <h3 className="font-heading text-xl mb-4">Ingredients</h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary-container mt-2 shrink-0" aria-hidden="true" />
                    <span className="font-sans">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-outline-variant/20" />

          {/* Instructions */}
          {recipe.instructions?.length > 0 && (
            <div>
              <h3 className="font-heading text-xl mb-4">Preparation</h3>
              <ol className="space-y-6">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-heading text-primary-fixed-dim text-2xl italic opacity-50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-1 font-sans leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Notes */}
          {recipe.notes && (
            <>
              <div className="border-t border-outline-variant/20" />
              <div>
                <h3 className="font-heading text-xl mb-3">Notes</h3>
                <p className="text-on-surface-variant whitespace-pre-wrap font-sans leading-relaxed">
                  {recipe.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
