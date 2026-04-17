# Design System Strategy: Modern Health-Tech SaaS (APP-DX)

## 1. Overview & Creative North Star: "The Clinical Sanctuary"
The digital landscape for healthcare is often cluttered, cold, and anxiety-inducing. This design system rejects the "dashboard fatigue" of traditional SaaS in favor of **The Clinical Sanctuary**. 

Our Creative North Star focuses on **Environmental Serenity**. We don't just build interfaces; we curate spaces. By utilizing intentional asymmetry, expansive negative space (breathing room), and high-contrast editorial typography, we transform complex medical data into a legible, authoritative narrative. This system breaks the "template" look by treating the UI as a series of physical layers—stacked sheets of frosted glass and fine medical vellum—rather than a flat grid of boxes.

---

## 2. Colors & The Tonal Philosophy

The palette is rooted in medical trust but elevated through a "High-End Editorial" lens. We move beyond flat blocks of color by utilizing tonal transitions that mimic natural light and depth.

### Color Strategy
*   **Primary (`#1B7A6B`):** Our "Surgical Teal." Used for primary actions and brand presence. To provide "visual soul," use subtle gradients transitioning from `primary` to `primary_container` for hero elements.
*   **Secondary (`#4490D9`):** "Diagnostic Blue." Reserved for informational highlights and secondary interactions.
*   **Tertiary/Accent (`#F5C518`):** "Clinical Alert." A high-visibility yellow used sparingly for attention-driven states (e.g., *Pendiente*).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through:
1.  **Background Color Shifts:** Placing a `surface_container_low` card on a `surface` background.
2.  **Subtle Tonal Transitions:** Using depth to imply separation. 

### The "Glass & Gradient" Rule
To achieve a premium feel, floating elements (modals, dropdowns, navigation rails) should utilize **Glassmorphism**. Apply a backdrop-blur (12px–20px) to semi-transparent surface colors. This allows the medical data to "bleed through" the interface, making the experience feel integrated and fluid.

---

## 3. Typography: Editorial Authority
We utilize a pairing of **Manrope** (Display/Headlines) and **Inter** (Body/Labels) to balance character with clinical precision.

*   **Display & Headline (Manrope):** High-end, geometric, and authoritative. Used for patient names, diagnostic titles, and hero stats. The intentional scale jump between `display-lg` (3.5rem) and `body-md` (0.875rem) creates an editorial hierarchy that guides the eye instantly to what matters.
*   **Body & Labels (Inter):** Maximized for legibility in dense medical records. High x-height ensures clarity at small sizes.

---

## 4. Elevation & Depth: Tonal Layering
We move away from traditional drop-shadows toward **Tonal Layering**.

*   **The Layering Principle:** Stacking `surface_container` tokens creates natural hierarchy. 
    *   *Level 0:* `background` (`#f8fafa`) – The canvas.
    *   *Level 1:* `surface_container_low` – Main content areas.
    *   *Level 2:* `surface_container_lowest` (White) – Primary interactive cards.
*   **Ambient Shadows:** If a "float" is required, use a `12%` opacity shadow tinted with the `on_surface` color, with a minimum blur of `24px`. Never use pure black shadows.
*   **The Ghost Border Fallback:** If accessibility requires a stroke, use `outline_variant` at **20% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Components: Clinical Precision

### Modern Form Fields
*   **Layout:** Labels use `label-md` in `on_surface_variant`. 
*   **The "Soft Input":** Fields use `surface_container_lowest` with a `12px` (token: `DEFAULT`) radius. Instead of a border, use a subtle 1px inner shadow or the "Ghost Border" on focus.
*   **States:** Error states use `error` and `error_container`—never just red text.

### Status Badges (Pills)
Badges must not look like buttons. They use low-saturation backgrounds with high-contrast text.
*   **Pendiente:** `tertiary_container` background / `on_tertiary_container` text.
*   **En Proceso:** `secondary_container` background / `on_secondary_container` text.
*   **Completado:** `primary_container` background / `on_primary_container` text.

### Buttons
*   **Primary:** `primary` background with a subtle linear gradient to `primary_container`. 12px rounded corners.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **Tertiary:** Ghost style, using `primary` text and `surface_variant` on hover.

### Cards & Lists
**Rule:** No dividers. Separate patient list items using vertical white space (16px–24px) or a alternating subtle shift between `surface` and `surface_container_low`. Use "Signature Textures" (subtle patterns or 2% opacity noise) on large card backgrounds to prevent a "plastic" feel.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use "Generous Spacing." If a section feels tight, double the padding.
*   **Do** use medical-themed icons (2pt stroke width) with rounded terminals to match our `12px` corner radius.
*   **Do** capitalize on asymmetry. A large headline on the left balanced by a "floating" glass card on the right feels custom and high-end.

### Don’t
*   **Don't** use 1px solid `#DDDDDD` borders. It destroys the "Sanctuary" aesthetic.
*   **Don't** use harsh, 100% black text. Use `on_surface` (`#191c1d`) for a softer, more professional tone.
*   **Don't** use "Default" shadows. If it looks like a standard web component, it's wrong. Soften, blur, and tint.

---

## 7. Token Reference Summary

| Token | Value | Usage |
| :--- | :--- | :--- |
| **Primary** | `#006053` | Brand, primary actions |
| **Secondary** | `#0061a3` | Informational, UI secondary |
| **Accent (Tertiary)** | `#745b00` | Critical status, warnings |
| **Surface** | `#f8fafa` | Main application background |
| **Radius (Default)** | `0.75rem (12px)` | All cards, buttons, inputs |
| **Elevation (Ambient)** | `0px 8px 24px rgba(25, 28, 29, 0.06)` | Floating Glass elements |