"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeForm } from "@/components/recipe-form";
import { RecipeDetail } from "@/components/recipe-detail";
import { Toaster, toast } from "sonner";
import {
  Plus,
  Search,
  LogOut,
  ChefHat,
  Heart,
} from "lucide-react";
import type { Recipe, RecipeCategory } from "@/lib/types";
import { categoryEmojis, categoryLabels } from "@/lib/types";
import { useRouter } from "next/navigation";

const allCategories: RecipeCategory[] = [
  "bakery",
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
  "drink",
];

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchRecipes = useCallback(async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load recipes");
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
    if (!confirm(`Delete "${recipe.title}"? This can't be undone.`)) return;

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipe.id);

    if (error) {
      toast.error("Failed to delete recipe");
    } else {
      toast.success("Recipe deleted");
      fetchRecipes();
    }
  }

  async function handleToggleFavorite(recipe: Recipe) {
    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: !recipe.is_favorite })
      .eq("id", recipe.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      fetchRecipes();
    }
  }

  function handleEdit(recipe: Recipe) {
    setEditingRecipe(recipe);
    setFormOpen(true);
  }

  function handleView(recipe: Recipe) {
    setViewingRecipe(recipe);
    setDetailOpen(true);
  }

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "favorites" && r.is_favorite) ||
      r.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-orange-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              La Joy Recipes
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingRecipe(null);
                setFormOpen(true);
              }}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Recipe
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and filters */}
        <div className="space-y-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/60"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/60 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-orange-100">
                All
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="data-[state=active]:bg-rose-100"
              >
                <Heart className="h-3.5 w-3.5 mr-1" />
                Favorites
              </TabsTrigger>
              {allCategories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="data-[state=active]:bg-orange-100"
                >
                  {categoryEmojis[cat]} {categoryLabels[cat]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Recipe grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl animate-bounce">{"\uD83C\uDF73"}</div>
            <p className="text-muted-foreground mt-2">Loading recipes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{"\uD83C\uDF7D\uFE0F"}</div>
            <h2 className="text-xl font-semibold mb-2">
              {recipes.length === 0
                ? "No recipes yet!"
                : "No recipes found"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {recipes.length === 0
                ? "Start by adding your first recipe"
                : "Try a different search or category"}
            </p>
            {recipes.length === 0 && (
              <Button
                onClick={() => {
                  setEditingRecipe(null);
                  setFormOpen(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Recipe
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleView}
              />
            ))}
          </div>
        )}
      </main>

      {/* Recipe Form Dialog */}
      <RecipeForm
        key={editingRecipe?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRecipe(null);
        }}
        onSaved={fetchRecipes}
        recipe={editingRecipe}
      />

      {/* Recipe Detail Sheet */}
      <RecipeDetail
        recipe={viewingRecipe}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
