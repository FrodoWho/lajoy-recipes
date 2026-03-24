"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Recipe } from "@/lib/types";
import { formatRichText, isSectionHeader, getSectionTitle } from "@/lib/format-text";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export function CookingMode({ recipe, onClose }: CookingModeProps) {
  // Filter out section headers for step navigation, but keep track of sections
  const steps = recipe.instructions ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate step numbers (skipping section headers)
  const stepNumbers: (number | null)[] = [];
  let counter = 0;
  steps.forEach((step) => {
    if (isSectionHeader(step)) {
      stepNumbers.push(null);
    } else {
      counter++;
      stepNumbers.push(counter);
    }
  });
  const totalSteps = counter;

  const currentStepNum = stepNumbers[currentIdx];
  const isSection = currentIdx < steps.length && isSectionHeader(steps[currentIdx]);

  const goNext = useCallback(() => {
    if (currentIdx < steps.length - 1) setCurrentIdx((i) => i + 1);
  }, [currentIdx, steps.length]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  // Swipe navigation
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe if horizontal movement is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }

  // Lock scroll on body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function toggleIngredient(i: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // Progress as percentage
  const progress = steps.length > 1 ? ((currentIdx) / (steps.length - 1)) * 100 : 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-surface flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`Kookmodus: ${recipe.title}`}
    >
      {/* Ingredients slide-out panel */}
      <div
        className={`fixed inset-y-0 left-0 z-[210] w-80 max-w-[85vw] bg-surface shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          ingredientsOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Ingrediënten paneel"
        aria-hidden={!ingredientsOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="font-heading text-lg font-bold text-on-surface">Ingrediënten</h2>
          <button
            onClick={() => setIngredientsOpen(false)}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Sluit ingrediënten"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-5">
          <ul className="space-y-3">
            {(recipe.ingredients ?? []).map((ing, i) => {
              if (isSectionHeader(ing)) {
                return (
                  <li key={i} className="pt-3 first:pt-0">
                    <p className="font-label text-xs font-bold text-primary uppercase tracking-wider border-b border-primary/20 pb-1.5">
                      {getSectionTitle(ing)}
                    </p>
                  </li>
                );
              }
              const checked = checkedIngredients.has(i);
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => toggleIngredient(i)}
                >
                  <span
                    className={`material-symbols-outlined text-sm mt-0.5 transition-all shrink-0 ${
                      checked ? "text-primary" : "text-outline-variant group-hover:text-primary-fixed-dim"
                    }`}
                    style={checked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {checked ? "check_circle" : "circle"}
                  </span>
                  <span className={`font-label text-sm leading-relaxed transition-all ${
                    checked ? "line-through text-on-surface-variant/40" : "text-on-surface"
                  }`}>
                    {formatRichText(ing)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Backdrop for ingredients panel */}
      {ingredientsOpen && (
        <div
          className="fixed inset-0 z-[205] bg-on-surface/20"
          onClick={() => setIngredientsOpen(false)}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <button
          onClick={() => setIngredientsOpen(true)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors p-2 -ml-2 rounded-lg"
          aria-label="Toon ingrediënten"
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu_book</span>
          <span className="font-label text-xs uppercase tracking-widest hidden sm:inline">Ingrediënten</span>
        </button>

        <div className="text-center">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest truncate max-w-48">
            {recipe.title}
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors p-2 -mr-2 rounded-lg"
          aria-label="Sluit kookmodus"
        >
          <span className="font-label text-xs uppercase tracking-widest hidden sm:inline">Sluiten</span>
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 shrink-0">
        <div className="h-1 bg-outline-variant/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-label text-[10px] text-on-surface-variant/60">
            {currentStepNum ? `Stap ${currentStepNum} van ${totalSteps}` : ""}
          </span>
          <span className="font-label text-[10px] text-on-surface-variant/60">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Main step content */}
      <div className="flex-grow flex items-center justify-center px-8 py-6 min-h-0" aria-live="polite">
        <div className="max-w-2xl w-full text-center">
          {isSection ? (
            <div>
              <span className="material-symbols-outlined text-5xl text-primary/60 mb-6" aria-hidden="true">bookmark</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-on-surface leading-tight">
                {getSectionTitle(steps[currentIdx])}
              </h2>
            </div>
          ) : (
            <div>
              <span className="font-heading text-6xl sm:text-8xl text-primary/20 block mb-6">
                {String(currentStepNum).padStart(2, "0")}
              </span>
              <p className="text-xl sm:text-2xl md:text-3xl leading-relaxed text-on-surface font-sans">
                {formatRichText(steps[currentIdx])}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-5 pb-6 pt-4 shrink-0">
        {/* Swipe hint */}
        <p className="text-center font-label text-[10px] text-on-surface-variant/40 uppercase tracking-widest mb-4 sm:hidden">
          Swipe om te navigeren
        </p>

        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-6 py-4 rounded-full bg-surface-container-highest text-on-surface hover:bg-outline-variant/30 transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span className="font-label text-sm hidden sm:inline">Vorige</span>
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5 items-center overflow-hidden max-w-32 sm:max-w-48">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`shrink-0 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? "w-6 h-2 bg-primary"
                    : i < currentIdx
                    ? "w-2 h-2 bg-primary/40"
                    : "w-2 h-2 bg-outline-variant/30"
                }`}
                aria-label={`Ga naar stap ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={currentIdx === steps.length - 1 ? onClose : goNext}
            className={`flex items-center gap-2 px-6 py-4 rounded-full transition-all active:scale-95 ${
              currentIdx === steps.length - 1
                ? "bg-primary text-white hover:opacity-90"
                : "bg-surface-container-highest text-on-surface hover:bg-outline-variant/30"
            }`}
          >
            <span className="font-label text-sm hidden sm:inline">
              {currentIdx === steps.length - 1 ? "Klaar!" : "Volgende"}
            </span>
            <span className="material-symbols-outlined" aria-hidden="true">
              {currentIdx === steps.length - 1 ? "check" : "arrow_forward"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
