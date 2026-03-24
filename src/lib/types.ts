export type RecipeCategory =
  | "bakery"
  | "dinner"
  | "lunch"
  | "breakfast"
  | "dessert"
  | "snack"
  | "drink";

export interface Recipe {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  description: string | null;
  category: RecipeCategory;
  prep_time: number | null;
  cook_time: number | null;
  fermentation_time: number | null;
  servings: number | null;
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  is_favorite: boolean;
  image_url: string | null;
}

export const categoryEmojis: Record<RecipeCategory, string> = {
  bakery: "\uD83E\uDD50",
  dinner: "\uD83C\uDF5D",
  lunch: "\uD83E\uDD57",
  breakfast: "\uD83E\uDD5E",
  dessert: "\uD83C\uDF70",
  snack: "\uD83C\uDF7F",
  drink: "\uD83E\uDD64",
};

export const categoryLabels: Record<RecipeCategory, string> = {
  bakery: "Bakkerij",
  dinner: "Diner",
  lunch: "Lunch",
  breakfast: "Ontbijt",
  dessert: "Dessert",
  snack: "Snack",
  drink: "Drank",
};
