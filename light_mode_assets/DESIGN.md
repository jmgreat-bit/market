# Design System Strategy: High-Tech Daybreak

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Celestial Laboratory."** 

We are moving away from the heavy, "gamer" aesthetics often associated with high-tech data and instead embracing an editorial, light-filled atmosphere. Imagine the precision of a scientific instrument bathed in the first light of dawn on a lunar outpost. The goal is to create a sense of vastness and clarity. 

To break the "template" look, this design system prioritizes **intentional asymmetry**. Do not center-align everything; allow for wide margins on one side and dense technical data on the other. Use overlapping elements—such as a glassmorphic card cutting across a high-contrast image—to create a sense of physical space and sophisticated depth.

## 2. Colors
The color palette is built on the tension between a vast, neutral "Lunar" foundation and high-energy "Pulse" accents.

*   **Primary (Electric Cobalt):** Use `primary_container` (#2E5BFF) as your main functional anchor. It represents connectivity and intelligence.
*   **Tertiary (Vivid Magenta):** Use `tertiary_container` (#d30078) sparingly. This is your "Pulse"—it should be used for critical alerts, live data pings, or high-conversion call-to-actions.
*   **Neutrals:** The `surface` (#f8f9fa) and its variants provide the atmosphere. 

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface_container_low` sidebar should sit directly against a `surface` main content area. The eye should perceive the edge through the change in tone, not a drawn line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to define importance:
*   **Base:** `surface` (#f8f9fa)
*   **Secondary Content:** `surface_container_low` (#f3f4f5)
*   **Deepest Inset:** `surface_container_highest` (#e1e3e4)
*   **Floating Elements:** `surface_container_lowest` (#ffffff) with 80% opacity and backdrop-blur.

### The "Glass & Gradient" Rule
To achieve the premium feel, use Glassmorphism for all floating modals and navigation bars. Combine `surface_container_lowest` with a `backdrop-filter: blur(20px)`. For main CTAs, apply a subtle linear gradient from `primary` (#0040e0) to `primary_container` (#2E5BFF) at a 135-degree angle to provide a "soul" and depth that flat color cannot replicate.

## 3. Typography
We utilize **Space Grotesk** exclusively. Its geometric construction feels engineered yet approachable.

*   **The Power Scale:** Leverage the extreme difference between `display-lg` (3.5rem) and `label-sm` (0.6875rem). Use `display` styles for key data points (e.g., a signal strength percentage) to make them feel like hero elements.
*   **Editorial Spacing:** For `headline` and `title` levels, decrease letter-spacing by -2% to create a tighter, more "locked-in" technical feel.
*   **Label Utility:** `label-md` and `label-sm` should be used for technical metadata. When using these, consider a slight increase in letter-spacing (+5%) and use Uppercase to mimic the appearance of etched serial numbers on hardware.

## 4. Elevation & Depth
In this design system, depth is a product of light and layering, not artificial shadows.

*   **The Layering Principle:** Achieve lift by stacking. A `surface_container_lowest` card placed on a `surface_container_low` background creates a natural, soft lift.
*   **Ambient Shadows:** If a shadow is required for a floating action, it must be "Ambient." Use the `on_surface` color at 4% opacity with a blur value of at least 40px and a 10px Y-offset. It should feel like a soft glow of occlusion, not a dark smudge.
*   **The "Ghost Border" Fallback:** If a layout requires a boundary for accessibility (e.g., high-density data tables), use a **Ghost Border**. This is a 1px line using the `outline_variant` (#c4c5d9) at 20% opacity. Never use 100% opaque borders.
*   **Glassmorphism Integration:** Use semi-transparent `surface_variant` layers to allow the "Electric Cobalt" of the background to bleed through slightly, ensuring the UI feels like one cohesive environment.

## 5. Components

### Buttons
*   **Primary:** A gradient-filled container (`primary` to `primary_container`) with `on_primary` (#ffffff) text. Use `full` roundedness for a "capsule" look.
*   **Secondary:** No fill. Use a "Ghost Border" and `primary` text.
*   **Tertiary:** Transparent background with `tertiary` (#a7005e) text for high-action "destructive" or "urgent" states.

### Chips
*   **Filter Chips:** Use `surface_container_high`. When selected, transition to `primary_container` with a subtle `primary_fixed_dim` inner glow.

### Input Fields
*   **Styling:** Avoid the "box" look. Use `surface_container_low` with a `surface_container_highest` bottom indicator (2px). Upon focus, the indicator transitions to `primary`.

### Cards & Lists
*   **Constraint:** **Forbid dividers.**
*   **Execution:** Separate list items using 8px of vertical white space or by alternating background tones between `surface` and `surface_container_low`.
*   **The "Pulse" Card:** For featured content, use a `tertiary_container` (Vivid Magenta) accent bar (4px) on the far-left edge of a glassmorphic card.

### Tooltips
*   **Styling:** Use `inverse_surface` (#2e3132) with `inverse_on_surface` (#f0f1f2) text. Keep the corners at `sm` (0.125rem) to maintain a sharp, technical precision.

## 6. Do's and Don'ts

### Do:
*   **Do** use extreme white space. If you think there is enough padding, add 16px more.
*   **Do** use "Electric Cobalt" for interactive paths and "Vivid Magenta" for state changes or live data.
*   **Do** lean into the geometric nature of Space Grotesk—align text to the baseline of adjacent icons with pixel-perfect precision.

### Don't:
*   **Don't** use pure black (#000000). It breaks the "Daybreak" atmosphere. Use `on_surface` (#191c1d).
*   **Don't** use standard "Drop Shadows" from a UI kit. They look dated and heavy.
*   **Don't** use 1px dividers to separate content. Let the tonal shifts of the `surface_container` tokens do the work.
*   **Don't** center-align long-form data. Keep it left-aligned to maintain the editorial grid.