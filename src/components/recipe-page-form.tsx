"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import type { Recipe, RecipeCategory } from "@/lib/types";
import { categoryLabels } from "@/lib/types";
import { isSectionHeader } from "@/lib/format-text";

/** Parse "250g Flour" into { qty: "250g", name: "Flour" } */
function parseIngredient(raw: string): { qty: string; name: string } {
  if (isSectionHeader(raw)) return { qty: "", name: raw };
  const match = raw.match(/^(\S+)\s+(.+)$/);
  if (match) return { qty: match[1], name: match[2] };
  return { qty: "", name: raw };
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

interface RecipePageFormProps {
  recipe?: Recipe | null;
}

export function RecipePageForm({ recipe }: RecipePageFormProps) {
  const isEditing = !!recipe;

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [category, setCategory] = useState<RecipeCategory>(recipe?.category ?? "dinner");
  const [prepTime, setPrepTime] = useState(recipe?.prep_time?.toString() ?? "");
  const [cookTime, setCookTime] = useState(recipe?.cook_time?.toString() ?? "");
  const [fermentationTime, setFermentationTime] = useState(recipe?.fermentation_time?.toString() ?? "");
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? "");
  const [ingredients, setIngredients] = useState<{ qty: string; name: string }[]>(
    recipe?.ingredients?.length
      ? recipe.ingredients.map(parseIngredient)
      : [{ qty: "", name: "" }, { qty: "", name: "" }, { qty: "", name: "" }]
  );
  const [instructions, setInstructions] = useState<string[]>(
    recipe?.instructions?.length ? recipe.instructions : ["", ""]
  );
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [imageUrl, setImageUrl] = useState(recipe?.image_url ?? "");
  const [imagePreview, setImagePreview] = useState(recipe?.image_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ingDragIdx, setIngDragIdx] = useState<number | null>(null);
  const [ingOverIdx, setIngOverIdx] = useState<number | null>(null);
  const [stepDragIdx, setStepDragIdx] = useState<number | null>(null);
  const [stepOverIdx, setStepOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Ingredient helpers
  function addIngredient() {
    setIngredients([...ingredients, { qty: "", name: "" }]);
  }
  function addIngredientSection() {
    setIngredients([...ingredients, { qty: "", name: "## " }]);
  }
  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }
  function updateIngredient(index: number, field: "qty" | "name", value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  // Instruction helpers
  function addInstruction() {
    setInstructions([...instructions, ""]);
  }
  function addInstructionSection() {
    setInstructions([...instructions, "## "]);
  }
  function removeInstruction(index: number) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }
  function updateInstruction(index: number, value: string) {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecteer een afbeelding");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Afbeelding moet kleiner zijn dan 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(supabase: ReturnType<typeof createClient>): Promise<string | null> {
    if (!imageFile) return imageUrl || null;
    setUploading(true);
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `recipe-images/${fileName}`;
    const { error } = await supabase.storage.from("recipes").upload(filePath, imageFile, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (error) {
      console.error("Upload error:", error);
      toast.error("Afbeelding uploaden mislukt");
      return imageUrl || null;
    }
    const { data: urlData } = supabase.storage.from("recipes").getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const uploadedUrl = await uploadImage(supabase);

    const filteredIngredients = ingredients
      .filter((i) => i.name.trim() !== "")
      .map((i) => (i.qty.trim() ? `${i.qty.trim()} ${i.name.trim()}` : i.name.trim()));
    const filteredInstructions = instructions.filter((i) => i.trim() !== "");

    const data = {
      title,
      description: description || null,
      category,
      prep_time: prepTime ? parseInt(prepTime) : null,
      cook_time: cookTime ? parseInt(cookTime) : null,
      fermentation_time: fermentationTime ? parseInt(fermentationTime) : null,
      servings: servings ? parseInt(servings) : null,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      notes: notes || null,
      image_url: uploadedUrl,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      const { error } = await supabase.from("recipes").update(data).eq("id", recipe!.id);
      if (error) { toast.error("Recept bijwerken mislukt"); console.error(error); }
      else { toast.success("Recept bijgewerkt!"); router.push(`/recipes/${recipe!.id}`); }
    } else {
      const { error } = await supabase.from("recipes").insert(data);
      if (error) { toast.error("Recept opslaan mislukt"); console.error(error); }
      else { toast.success("Recept opgeslagen!"); router.push("/"); }
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleDiscard() {
    if (isEditing) router.push(`/recipes/${recipe!.id}`);
    else router.push("/");
  }

  // Step number counter that skips section headers
  let stepCounter = 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar onSignOut={handleSignOut} />

      <main className="flex-grow pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 relative">
            <span className="font-label text-secondary-lajoy uppercase tracking-[0.2em] text-xs mb-4 block">
              {isEditing ? "Bewerken" : "Nieuw Recept"}
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl text-on-surface leading-tight max-w-2xl">
              {isEditing ? (
                <>Recept <span className="italic text-primary">Bewerken</span></>
              ) : (
                <>Maak een Nieuw <span className="italic text-primary">Meesterwerk</span></>
              )}
            </h1>
            <div className="absolute -top-10 -right-4 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl -z-10" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Media & Meta */}
              <div className="lg:col-span-5 space-y-8">
                {/* Image Upload */}
                <div
                  className="group relative aspect-square md:aspect-[4/5] bg-surface-container-highest rounded-xl overflow-hidden border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} className="hidden" aria-label="Upload afbeelding" />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Voorbeeld" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-on-surface/0 group-hover:bg-on-surface/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                          <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-3 rounded-full bg-surface/90 text-on-surface hover:bg-surface transition-colors" aria-label="Afbeelding wijzigen">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="p-3 rounded-full bg-surface/90 text-error-lajoy hover:bg-error-container transition-colors" aria-label="Afbeelding verwijderen">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-outline mb-4">add_a_photo</span>
                      <p className="font-label text-sm text-on-surface-variant">Upload Afbeelding</p>
                      <p className="font-label text-[10px] text-outline mt-2 uppercase tracking-widest">JPG, PNG, WebP tot 5MB</p>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                    </div>
                  )}
                </div>

                {/* Category & Times */}
                <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
                  <div>
                    <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-3">Categorie</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as RecipeCategory)} className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none">
                      {(Object.keys(categoryLabels) as RecipeCategory[]).map((cat) => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-3">Voorbereidingstijd</label>
                      <input className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="20 min" type="text" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-3">Kooktijd</label>
                      <input className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="30 min" type="text" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-3">Rijstijd</label>
                      <input className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="12 uur" type="text" value={fermentationTime} onChange={(e) => setFermentationTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-3">Porties</label>
                    <input className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="2-4" type="text" value={servings} onChange={(e) => setServings(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-7 space-y-12">
                {/* Title */}
                <section>
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-4">Titel</label>
                  <input className="w-full text-3xl font-heading bg-transparent border-b border-outline-variant/30 pb-4 focus:outline-none focus:border-primary transition-colors placeholder:text-surface-dim italic" placeholder="Bijv. Oma's appeltaart..." type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </section>

                {/* Description */}
                <section>
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-4">Beschrijving</label>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-xl font-sans text-base p-6 focus:ring-2 focus:ring-primary/20 min-h-[4rem] leading-relaxed outline-none resize-none overflow-hidden"
                    placeholder="Een korte beschrijving van je recept..."
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                    ref={(el) => { if (el && description) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                  />
                </section>

                {/* Ingredients with drag & drop and section headers */}
                <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
                  <div className="flex justify-between items-end mb-6">
                    <h3 className="font-heading text-2xl">Ingrediënten</h3>
                    <div className="flex gap-3">
                      <button type="button" onClick={addIngredientSection} className="font-label text-xs uppercase tracking-widest text-primary flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">title</span> Sectie
                      </button>
                      <button type="button" onClick={addIngredient} className="font-label text-xs uppercase tracking-widest text-secondary-lajoy flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span> Toevoegen
                      </button>
                    </div>
                  </div>
                  <p className="font-label text-[10px] text-outline-variant mb-4">Gebruik **vet** en __onderstreept__ voor opmaak. Sleep items om te herordenen.</p>
                  <div className="space-y-1">
                    {ingredients.map((ing, i) => {
                      const isSection = isSectionHeader(ing.name);
                      const isDragging = ingDragIdx === i;
                      const isDropTarget = ingOverIdx === i && ingDragIdx !== null && ingDragIdx !== i;
                      return (
                        <div key={i} className="relative">
                          {isDropTarget && (
                            <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 animate-pulse" />
                          )}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIngOverIdx(i); }}
                            onDrop={() => { if (ingDragIdx !== null) setIngredients(reorder(ingredients, ingDragIdx, i)); setIngDragIdx(null); setIngOverIdx(null); }}
                            className={`flex gap-3 items-center rounded-lg transition-all duration-200 ${
                              isDragging ? "opacity-20 scale-95" : ""
                            } ${isDropTarget ? "bg-primary-container/10" : ""}`}
                          >
                            <div
                              draggable
                              onDragStart={() => setIngDragIdx(i)}
                              onDragEnd={() => { setIngDragIdx(null); setIngOverIdx(null); }}
                              className="flex items-center gap-0.5 shrink-0 cursor-grab active:cursor-grabbing select-none p-1.5 -ml-1.5 rounded-md hover:bg-surface-container-high transition-colors group/handle"
                              title="Sleep om te verplaatsen"
                            >
                              <span className="material-symbols-outlined text-base text-outline-variant/40 group-hover/handle:text-primary transition-colors" aria-hidden="true">drag_indicator</span>
                            </div>
                          {isSection ? (
                            <input
                              className="flex-grow bg-primary-container/20 border-none rounded-lg font-label text-sm font-bold py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Sectietitel (bijv. Dag 1, Voor het deeg...)"
                              type="text"
                              value={ing.name.slice(3)}
                              onChange={(e) => updateIngredient(i, "name", "## " + e.target.value)}
                            />
                          ) : (
                            <>
                              <input className="w-16 sm:w-24 bg-surface-container-low border-none rounded-lg font-label text-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Hvh" type="text" value={ing.qty} onChange={(e) => updateIngredient(i, "qty", e.target.value)} aria-label={`Ingrediënt ${i + 1} hoeveelheid`} />
                              <input className="flex-grow bg-surface-container-low border-none rounded-lg font-label text-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ingrediënt..." type="text" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} aria-label={`Ingrediënt ${i + 1} naam`} />
                            </>
                          )}
                          {ingredients.length > 1 && (
                            <button type="button" onClick={() => removeIngredient(i)} className="text-outline-variant/40 hover:text-error-lajoy transition-colors shrink-0" aria-label={`Ingrediënt ${i + 1} verwijderen`}>
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Instructions with drag & drop and section headers */}
                <section>
                  <div className="flex justify-between items-end mb-6">
                    <h3 className="font-heading text-2xl">Bereiding</h3>
                    <div className="flex gap-3">
                      <button type="button" onClick={addInstructionSection} className="font-label text-xs uppercase tracking-widest text-primary flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">title</span> Sectie
                      </button>
                      <button type="button" onClick={addInstruction} className="font-label text-xs uppercase tracking-widest text-secondary-lajoy flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">playlist_add</span> Stap Toevoegen
                      </button>
                    </div>
                  </div>
                  <p className="font-label text-[10px] text-outline-variant mb-6">Gebruik **vet** en __onderstreept__ voor opmaak. Sleep items om te herordenen.</p>
                  <div className="space-y-2">
                    {instructions.map((step, i) => {
                      const isSection = isSectionHeader(step);
                      if (!isSection) stepCounter++;
                      const currentStep = stepCounter;
                      const isDragging = stepDragIdx === i;
                      const isDropTarget = stepOverIdx === i && stepDragIdx !== null && stepDragIdx !== i;

                      return (
                        <div key={i} className="relative">
                          {isDropTarget && (
                            <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 animate-pulse" />
                          )}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setStepOverIdx(i); }}
                            onDrop={() => { if (stepDragIdx !== null) setInstructions(reorder(instructions, stepDragIdx, i)); setStepDragIdx(null); setStepOverIdx(null); }}
                            className={`flex gap-4 transition-all duration-200 rounded-xl ${
                              isDragging ? "opacity-20 scale-95" : ""
                            } ${isDropTarget ? "bg-primary-container/10" : ""}`}
                          >
                            <div
                              draggable
                              onDragStart={() => setStepDragIdx(i)}
                              onDragEnd={() => { setStepDragIdx(null); setStepOverIdx(null); }}
                              className="flex items-center shrink-0 cursor-grab active:cursor-grabbing select-none p-1.5 -ml-1.5 mt-5 rounded-md hover:bg-surface-container-high transition-colors group/handle self-start"
                              title="Sleep om te verplaatsen"
                            >
                              <span className="material-symbols-outlined text-base text-outline-variant/40 group-hover/handle:text-primary transition-colors" aria-hidden="true">drag_indicator</span>
                            </div>
                          {isSection ? (
                            <div className="flex-grow flex gap-2">
                              <input
                                className="flex-grow bg-primary-container/20 border-none rounded-lg font-label text-sm font-bold py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Sectietitel (bijv. Dag 1, Afwerking...)"
                                type="text"
                                value={step.slice(3)}
                                onChange={(e) => updateInstruction(i, "## " + e.target.value)}
                              />
                              {instructions.length > 1 && (
                                <button type="button" onClick={() => removeInstruction(i)} className="text-outline-variant/40 hover:text-error-lajoy transition-colors shrink-0" aria-label={`Sectie verwijderen`}>
                                  <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <span className="font-heading text-primary-fixed-dim text-3xl italic opacity-50 shrink-0">
                                {String(currentStep).padStart(2, "0")}
                              </span>
                              <div className="flex-grow flex gap-2">
                                <textarea
                                  className="w-full bg-surface-container-low border-none rounded-xl font-sans text-base p-6 focus:ring-2 focus:ring-primary/20 min-h-[4rem] leading-relaxed outline-none resize-none overflow-hidden"
                                  placeholder={currentStep === 1 ? "Beschrijf de eerste stap van de bereiding..." : "Volgende stappen..."}
                                  value={step}
                                  onChange={(e) => {
                                    updateInstruction(i, e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = e.target.scrollHeight + "px";
                                  }}
                                  onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                                  ref={(el) => { if (el && step) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                                  aria-label={`Stap ${currentStep}`}
                                />
                                {instructions.length > 1 && (
                                  <button type="button" onClick={() => removeInstruction(i)} className="text-outline-variant/40 hover:text-error-lajoy transition-colors shrink-0 self-start mt-6" aria-label={`Stap ${currentStep} verwijderen`}>
                                    <span className="material-symbols-outlined text-lg">close</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Notes */}
                <section>
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-4">Notities</label>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-xl font-sans text-base p-6 focus:ring-2 focus:ring-primary/20 min-h-[4rem] leading-relaxed outline-none resize-none overflow-hidden"
                    placeholder="Tips, variaties, of verhalen over dit recept..."
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                    ref={(el) => { if (el && notes) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                  />
                </section>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-20 pt-10 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-6">
              <button type="button" onClick={handleDiscard} className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant hover:text-error-lajoy transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">{isEditing ? "undo" : "delete_sweep"}</span>
                {isEditing ? "Wijzigingen Annuleren" : "Concept Verwijderen"}
              </button>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button type="button" onClick={handleDiscard} className="flex-1 md:flex-none px-10 py-4 rounded-full font-label text-xs uppercase tracking-[0.2em] bg-secondary-container text-on-secondary-container hover:bg-secondary-lajoy hover:text-white transition-all active:scale-95">
                  Annuleren
                </button>
                <button type="submit" disabled={saving || uploading} className="flex-1 md:flex-none px-12 py-4 rounded-full font-label text-xs uppercase tracking-[0.2em] bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50">
                  {uploading ? "Uploaden..." : saving ? "Opslaan..." : isEditing ? "Recept Bijwerken" : "Recept Opslaan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
