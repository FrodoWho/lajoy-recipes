"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { categoryEmojis, categoryLabels } from "@/lib/types";

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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{categoryEmojis[recipe.category]}</span>
            <Badge
              variant="secondary"
              className="bg-orange-50 text-orange-700 border-orange-200"
            >
              {categoryLabels[recipe.category]}
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{recipe.title}</SheetTitle>
          {recipe.description && (
            <p className="text-muted-foreground">{recipe.description}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick info */}
          <div className="flex gap-6 text-sm">
            {recipe.prep_time != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-500" aria-hidden="true" />
                <span>
                  <strong>Prep:</strong> {recipe.prep_time} min
                </span>
              </div>
            )}
            {recipe.cook_time != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-rose-500" aria-hidden="true" />
                <span>
                  <strong>Cook:</strong> {recipe.cook_time} min
                </span>
              </div>
            )}
            {totalTime && (
              <div className="text-muted-foreground">
                Total: {totalTime} min
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {"\uD83E\uDDC2"} Ingredients
              </h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0" aria-hidden="true" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Instructions */}
          {recipe.instructions?.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {"\uD83D\uDCDD"} Instructions
              </h3>
              <ol className="space-y-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-white font-bold text-sm shrink-0">
                      {i + 1}
                    </span>
                    <p className="pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Notes */}
          {recipe.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  {"\uD83D\uDCA1"} Notes
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
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
