# Design System Document: The Midnight Navigator

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Midnight Navigator."** This system is designed to feel like a high-end, heads-up display (HUD) for an exclusive urban explorer. It rejects the flat, sterile nature of standard web interfaces in favor of a cinematic, layered experience that mimics the aesthetic of high-tech urban nightlife.

We break the "template" look through **intentional depth and luminosity**. By utilizing heavy glassmorphism and a "dark-first" philosophy, the UI doesn't just sit on the screen—it glows within an obsidian void. The layout favors breathing room and tonal shifts over rigid grid lines, ensuring that every interaction feels premium, dynamic, and purposeful.

## 2. Colors & Atmospheric Depth
The palette is rooted in deep obsidian tones, punctuated by high-energy neon signals that guide the user's eye through the "night."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be defined solely through background color shifts or tonal transitions. Use `surface-container-low` (#131314) for sectioning against a `surface` (#0e0e0f) background. If visual separation is needed, use white space or a change in surface tier.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to "stack" elements:
*   **Base:** `surface` (#0e0e0f)
*   **Sectioning:** `surface-container-low` (#131314)
*   **Interactive Cards:** `surface-container` (#1a191b)
*   **Floating Elements:** `surface-container-high` (#201f21) with Backdrop Blur.

### The "Glass & Gradient" Rule
To achieve the "signature" look, all floating overlays must utilize **Glassmorphism**:
*   **Fill:** `surface-container-highest` (#262627) at 40%–60% opacity.
*   **Effect:** Backdrop Blur (20px–40px).
*   **Soul Gradients:** Main CTAs should never be flat. Use a linear gradient from `primary` (#8ff5ff) to `primary_container` (#00eefc) to provide visual "soul" and dimension.

## 3. Typography
The typography system balances the technical precision of a geometric sans-serif with the editorial impact of high-contrast scales.

*   **Display & Headlines:** We use `Space Grotesk`. Its angularity reflects the "High-Tech" vibe. Use `display-lg` (3.5rem) for hero moments to create an authoritative, editorial feel.
*   **Body & Labels:** We use `Inter`. It provides maximum legibility on dark backgrounds. 
*   **Contrast as Hierarchy:** Instead of more colors, use weight. A `headline-lg` in Bold conveys more "exclusive" energy than a colored subheader. Keep body text at `on_surface_variant` (#adaaab) to ensure the `primary` neon accents remain the focal point.

## 4. Elevation & Depth
In "The Midnight Navigator," depth is a consequence of light and layering, not structural shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural "lift" through color theory rather than artificial drop shadows.
*   **Ambient Glows (Shadows):** Standard grey shadows are forbidden. When a floating effect is required, use a shadow tinted with the `primary` or `secondary` token at 8% opacity with a large blur (32px+). This mimics the way neon light bleeds into a dark room.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**: `outline-variant` (#484849) at 15% opacity. Never use 100% opaque borders.

## 5. Components

### Glassmorphic Cards
*   **Style:** No borders. Background: `surface-container` at 50% opacity with 30px backdrop blur.
*   **Corner Radius:** `xl` (1.5rem) for outer containers, `md` (0.75rem) for internal nested elements.
*   **Spacing:** Enforced vertical white space of 24px-32px instead of dividers.

### Glowing Map Markers
*   **Visual:** A central dot of `primary` (#8ff5ff) surrounded by two concentric rings.
*   **Effect:** A continuous "Pulse" animation using `primary_dim` (#00deec) at 20% opacity expanding outward.

### Floating Navigation
*   **Positioning:** Fixed bottom, detached from the screen edges (16px margin).
*   **Style:** Glassmorphic pill (`full` roundness). Active states should use a subtle `primary` glow under the icon, never a solid background block.

### Sleek Bottom Sheets
*   **Radius:** `xl` (1.5rem) on top corners only.
*   **Scrim:** `surface_container_lowest` (#000000) at 70% opacity to dim the map background.

### Buttons
*   **Primary:** Gradient of `primary` to `primary_dim`. Text color: `on_primary_fixed` (#003f43).
*   **Secondary/Glass:** `surface_bright` (#2c2c2d) at 30% opacity with a `Ghost Border`.

### Input Fields
*   **Style:** Minimalist. No background fill—only a bottom "Ghost Border." 
*   **Focus State:** The border transitions to a 1px `primary` glow.

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place headline text off-center to create a dynamic, modern editorial look.
*   **Embrace the Blur:** Use backdrop blur on all overlapping elements to maintain a sense of "place" in the local discovery map.
*   **Prioritize Breathing Room:** Use the `xl` spacing scale between disparate content blocks.

### Don't:
*   **Don't use dividers:** Never use a solid line to separate list items. Use 16px of vertical space or a `surface-container` shift.
*   **Don't use pure grey:** Every "dark" color must have the slight blue/charcoal tint of the `surface` palette to avoid a "flat" black look.
*   **Don't over-saturate:** Use neon accents (`primary`, `secondary`, `tertiary`) sparingly. If everything glows, nothing is important.