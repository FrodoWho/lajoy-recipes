"use client";

import { useEffect, useState, useMemo, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { RecipePageForm } from "@/components/recipe-page-form";
import { NavBar } from "@/components/nav-bar";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
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
        router.push("/");
      } else {
        setRecipe(data);
      }
      setLoading(false);
    }

    fetchRecipe();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <NavBar />
        <div className="flex-grow flex items-center justify-center pt-28">
          <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse">
            skillet
          </span>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return <RecipePageForm recipe={recipe} />;
}
