"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, Heart, MoreVertical, Users, Pencil, Trash2 } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { categoryEmojis, categoryLabels } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onClick: (recipe: Recipe) => void;
}

export function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onToggleFavorite,
  onClick,
}: RecipeCardProps) {
  const totalTime =
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null;

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/70 backdrop-blur-sm overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => onClick(recipe)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(recipe); } }}
      tabIndex={0}
      role="article"
      aria-label={`Recipe: ${recipe.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{categoryEmojis[recipe.category]}</span>
              <Badge
                variant="secondary"
                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
              >
                {categoryLabels[recipe.category]}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg leading-tight truncate">
              {recipe.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(recipe);
              }}
              aria-label={recipe.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                aria-hidden="true"
                className={`h-4 w-4 transition-colors ${
                  recipe.is_favorite
                    ? "fill-rose-500 text-rose-500"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(e) => e.stopPropagation()}
                aria-label="Recipe options"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(recipe);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(recipe);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {recipe.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {totalTime} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {recipe.servings} servings
            </span>
          )}
          {recipe.ingredients?.length > 0 && (
            <span>{recipe.ingredients.length} ingredients</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
