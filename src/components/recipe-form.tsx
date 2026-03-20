"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Recipe, RecipeCategory } from "@/lib/types";
import { categoryLabels } from "@/lib/types";

interface RecipeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  recipe?: Recipe | null;
}

export function RecipeForm({
  open,
  onOpenChange,
  onSaved,
  recipe,
}: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [category, setCategory] = useState<RecipeCategory>(
    recipe?.category ?? "dinner"
  );
  const [prepTime, setPrepTime] = useState(recipe?.prep_time?.toString() ?? "");
  const [cookTime, setCookTime] = useState(recipe?.cook_time?.toString() ?? "");
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? "");
  const [ingredients, setIngredients] = useState<string[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [""]
  );
  const [instructions, setInstructions] = useState<string[]>(
    recipe?.instructions?.length ? recipe.instructions : [""]
  );
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [saving, setSaving] = useState(false);

  function addIngredient() {
    setIngredients([...ingredients, ""]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, value: string) {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  }

  function addInstruction() {
    setInstructions([...instructions, ""]);
  }

  function removeInstruction(index: number) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, value: string) {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const filteredIngredients = ingredients.filter((i) => i.trim() !== "");
    const filteredInstructions = instructions.filter((i) => i.trim() !== "");

    const data = {
      title,
      description: description || null,
      category,
      prep_time: prepTime ? parseInt(prepTime) : null,
      cook_time: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    if (recipe) {
      const { error } = await supabase
        .from("recipes")
        .update(data)
        .eq("id", recipe.id);

      if (error) {
        toast.error("Failed to update recipe");
        console.error(error);
      } else {
        toast.success("Recipe updated!");
        onSaved();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("recipes").insert(data);

      if (error) {
        toast.error("Failed to save recipe");
        console.error(error);
      } else {
        toast.success("Recipe saved!");
        onSaved();
        onOpenChange(false);
      }
    }

    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-surface">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {recipe ? "Edit Recipe" : "New Recipe"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block" htmlFor="edit-title">
                Recipe Title *
              </label>
              <input
                id="edit-title"
                placeholder="Grandma's chocolate cake..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-lg font-heading bg-surface-container-highest border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block" htmlFor="edit-desc">
                Description
              </label>
              <textarea
                id="edit-desc"
                placeholder="A short description of this delicious recipe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {(Object.keys(categoryLabels) as RecipeCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block" htmlFor="edit-servings">
                Servings
              </label>
              <input
                id="edit-servings"
                type="number"
                min="1"
                placeholder="4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block" htmlFor="edit-prep">
                Prep Time (min)
              </label>
              <input
                id="edit-prep"
                type="number"
                min="0"
                placeholder="15"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block" htmlFor="edit-cook">
                Cook Time (min)
              </label>
              <input
                id="edit-cook"
                type="number"
                min="0"
                placeholder="30"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-heading text-lg">Ingredients</label>
              <button
                type="button"
                onClick={addIngredient}
                className="font-label text-xs uppercase tracking-widest text-secondary-lajoy flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add
              </button>
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder={`Ingredient ${i + 1}...`}
                  value={ing}
                  onChange={(e) => updateIngredient(i, e.target.value)}
                  aria-label={`Ingredient ${i + 1}`}
                  className="flex-1 bg-surface-container-low border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="text-outline-variant/40 hover:text-error-lajoy transition-colors shrink-0 px-2"
                    aria-label={`Remove ingredient ${i + 1}`}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-heading text-lg">Instructions</label>
              <button
                type="button"
                onClick={addInstruction}
                className="font-label text-xs uppercase tracking-widest text-secondary-lajoy flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Step
              </button>
            </div>
            {instructions.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex items-center justify-center w-8 h-10 font-heading text-primary-fixed-dim text-lg italic opacity-50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <textarea
                  placeholder={`Step ${i + 1}...`}
                  value={step}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  rows={2}
                  className="flex-1 bg-surface-container-low border-none rounded-lg font-sans text-sm p-4 focus:ring-2 focus:ring-primary/20 outline-none"
                  aria-label={`Instruction step ${i + 1}`}
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(i)}
                    className="text-outline-variant/40 hover:text-error-lajoy transition-colors shrink-0 px-2"
                    aria-label={`Remove step ${i + 1}`}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block" htmlFor="edit-notes">
              Notes
            </label>
            <textarea
              id="edit-notes"
              placeholder="Any tips, variations, or stories about this recipe..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none font-sans"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 rounded-full font-label text-xs uppercase tracking-widest bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-full font-label text-xs uppercase tracking-widest bg-primary text-white shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : recipe ? "Update Recipe" : "Save Recipe"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
