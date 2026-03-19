"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Recipe, RecipeCategory } from "@/lib/types";
import { categoryEmojis, categoryLabels } from "@/lib/types";

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {recipe ? "Edit Recipe" : "New Recipe"} {categoryEmojis[category]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Recipe Title *</Label>
              <Input
                id="title"
                placeholder="Grandma's chocolate cake..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-lg"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A short description of this delicious recipe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as RecipeCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(categoryEmojis) as RecipeCategory[]
                  ).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryEmojis[cat]} {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                placeholder="4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prep">Prep Time (min)</Label>
              <Input
                id="prep"
                type="number"
                min="0"
                placeholder="15"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cook">Cook Time (min)</Label>
              <Input
                id="cook"
                type="number"
                min="0"
                placeholder="30"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add
              </Button>
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Ingredient ${i + 1}...`}
                  value={ing}
                  onChange={(e) => updateIngredient(i, e.target.value)}
                  aria-label={`Ingredient ${i + 1}`}
                />
                {ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(i)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`Remove ingredient ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Instructions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInstruction}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Step
              </Button>
            </div>
            {instructions.map((step, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex items-center justify-center w-8 h-10 rounded-full bg-orange-100 text-orange-700 font-bold text-sm shrink-0">
                  {i + 1}
                </span>
                <Textarea
                  placeholder={`Step ${i + 1}...`}
                  value={step}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  rows={2}
                  className="flex-1"
                  aria-label={`Instruction step ${i + 1}`}
                />
                {instructions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInstruction(i)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`Remove step ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any tips, variations, or stories about this recipe..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              {saving ? "Saving..." : recipe ? "Update Recipe" : "Save Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
