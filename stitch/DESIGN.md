# Design System Strategy: The Sunlit Atelier

## 1. Overview & Creative North Star
The visual direction for this design system is **"The Sunlit Atelier."** We are moving away from the rustic, heavy earthiness of the previous iteration toward an ethereal, editorial aesthetic that feels curated, light-filled, and intentionally composed. 

This system rejects the "template" look. We do not use rigid, boxed-in grids. Instead, we embrace **Intentional Asymmetry** and **Tonal Depth**. The goal is to make the digital interface feel like a high-end physical lookbook. By utilizing overlapping elements, generous white space (using our 5.5rem and 7rem spacing tokens), and dramatic typographic scales, we create a rhythmic flow that guides the user through a "curated hearth" experience.

---

## 2. Colors
Our palette centers on the interplay between the warmth of a soft butter yellow and the sophisticated cool of an elegant lilac.

*   **Primary (Butter Yellow):** Use `primary_container` (#f9e076) for large expressive areas to radiate warmth. Use `primary` (#6e5d00) for high-contrast actions and critical text.
*   **Secondary (Elegant Lilac):** Use `secondary` (#68548d) and its variants to provide a sense of mystery and "shadow" against the sunlit yellow. Lilac should be used for secondary CTAs, highlights, and moments of discovery.
*   **Neutral (The Warm Hearth):** Our background `surface` (#fff8f1) is not white; it is a creamy, tactile base that prevents the interface from feeling clinical.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. We define boundaries through **Background Color Shifts**. To separate content, transition from a `surface` background to a `surface-container-low` (#f9f3eb) or `surface-container-highest` (#e8e1da) section. 

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine papers. 
*   **Base:** `surface`
*   **Layer 1:** `surface-container-low` (for subtle content grouping)
*   **Layer 2:** `surface-container-highest` (for interactive elements or featured pull-outs)

### The "Glass & Gradient" Rule
To add "soul" to the UI, use subtle linear gradients for Hero sections, transitioning from `primary_container` to `surface`. For floating navigation or overlays, apply **Glassmorphism**: use `surface_variant` at 70% opacity with a `24px` backdrop-blur. This ensures the butter-yellow warmth bleeds through the lilac elements, integrating the layers.

---

## 3. Typography
We use **Noto Serif** as our primary voice—it is the "ink" that provides the artisanal, modern farmhouse feel. **Work Sans** is reserved for functional utility.

*   **Display (Lg/Md/Sm):** These are your "Editorial Headlines." Use `display-lg` (3.5rem) with tight letter-spacing for high-impact brand moments. 
*   **Headline & Title:** Used for content hierarchy. Noto Serif’s organic curves in `headline-lg` (2rem) evoke the feeling of a bespoke invitation.
*   **Body:** `body-lg` (1rem) is our workhorse. Ensure line-height is generous to maintain the "breathing room" required by the Atelier aesthetic.
*   **Labels:** `label-md` (Work Sans, 0.75rem) should be used for metadata, captions, and overlines. This sans-serif contrast ensures functional information is legible without distracting from the editorial serif flow.

---

## 4. Elevation & Depth
In this design system, depth is a feeling, not a structure.

*   **The Layering Principle:** Achieve elevation by stacking surface tiers. A `surface-container-lowest` card placed on a `surface-container-high` section creates a natural "lift" through color theory alone.
*   **Ambient Shadows:** If a floating effect is required (e.g., for a primary modal), use a shadow with a `32px` blur and `6%` opacity. The shadow color must be a tinted version of `on-surface` (#1d1b17), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline_variant` (#cec6b2) at 20% opacity. It should be barely perceptible—a "whisper" of a line.
*   **Glassmorphism & Depth:** Use semi-transparent lilac (`secondary_container`) for tooltips or flyouts to create a "frosted lavender glass" effect, softening the UI’s edges.

---

## 5. Components

### Buttons
*   **Primary:** `primary` background with `on_primary` text. Use `full` roundedness (9999px) to contrast against the sharp editorial typography.
*   **Secondary:** `secondary_container` background. This provides the "Elegant Lilac" highlight.
*   **Tertiary:** Text-only using `primary`, with a subtle `primary_fixed_dim` underline on hover.

### Cards & Lists
*   **The Divider Ban:** Never use horizontal lines to separate items. Use the spacing scale (e.g., `spacing-6` or `2rem`) to create "visual gutters."
*   **Asymmetric Cards:** For "Digital Atelier" storytelling, use cards with staggered heights and variable `roundedness-xl` (1.5rem) to break the grid.

### Input Fields
*   **Styling:** Use a `surface-container-highest` fill with no border. On focus, transition the background to `surface-lowest` and add a `2px` "Ghost Border" of `primary`.
*   **Labels:** Use `label-md` (Work Sans) floating above the input to maintain a clean, architectural look.

### The "Atelier Folio" (Custom Component)
A signature layout component consisting of a large `display-md` heading, an overlapping `surface-container-low` image container, and a `body-lg` text block offset to the right. This creates the "curated" look central to this design system.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use `primary_fixed_dim` for subtle background accents behind Noto Serif text.
*   **Do** embrace white space. If a layout feels "crowded," double the spacing using the `20` (7rem) token.
*   **Do** use asymmetric image crops (e.g., one rounded corner `xl`, three corners `none`).

### Don't:
*   **Don't** use 1px solid black or grey borders. Use background tonal shifts instead.
*   **Don't** use standard "drop shadows." If it doesn't look like ambient light, don't use it.
*   **Don't** center-align long blocks of text. Stick to editorial left-alignment to maintain the "Atelier" structure.
*   **Don't** use the secondary lilac for "Warning" or "Error" states; reserve it strictly for elegance and highlights. Use the `error` (#ba1a1a) tokens for alerts.