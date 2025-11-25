# Ancient Tech UI/UX Redesign Roadmap

This document tracks how we will implement the new "ancient civilizations meets advanced technology" direction. Each phase builds on the previous one so we can land changes safely without breaking core gameplay readability.

---

## Phase 1 · Foundation (DONE → In progress)

### ✅ Theme tokens

- Defined palette + glow presets in CSS (`app/globals.css`) and JS (`lib/theme/tokens.ts`).
- Introduced dedicated Next fonts:
  - `Cinzel` → display headers (`--font-ancient-display`)
  - `Rajdhani` → primary body copy (`--font-ancient-sans`)
  - `Share Tech Mono` → stats & numbers (`--font-ancient-mono`)
- Added ambient parallax gradients + etched-noise overlays for body background.

### ⏩ Landing page scaffolding

- Replace existing hero background with layered `parallax` utility (CSS custom property already added).
- Build reusable tablet surface styles:
  - `.ancient-panel` (stone tablet)
  - `.ancient-holo` (holographic glass with cyan glow)
- Convert menu cards to `ancient-panel` + add hover state:
  - Border gradient: bronze → cyan.
  - Hover lifts using `transform: translateY(-8px)` + `box-shadow: var(--glow-cyan)`.

### ⏩ Game board structural styles

- Create CSS helpers:
  - `.board-surface` → stone texture, vignette, glyph corners.
  - `.board-tile` → beveled tiles (default, hover, active, occupied variants).
  - `.board-tile-center` → amber-glow star cell (rotating glyph via `@keyframes orbitGlyph`).
- Update `components/game/GameBoard.tsx` to map tile state → helper classes instead of raw Tailwind strings.

---

## Phase 2 · Core Interactions

### Letter tiles

- Replace flat Tailwind tiles with **runestones**:
  - Background: procedural noise + gradient from bronze to verdigris.
  - Edge highlight on hover, cyan particle trail on drag (Framer Motion).
  - Value text uses `var(--font-ancient-mono)` with per-value glow intensity.

### Word placement feedback

- Success sequence:
  1. Tiles scale up slightly + emit `glow-amber`.
  2. Board squares pulse cyan → amber.
  3. Score counter increments with segmented display animation.
- Failure sequence:
  - Shake animation, red glow, return to rack with elastic easing.

### Status panel refresh

- Rebuild using weathered metal plates:
  - Player nameplates embossed; add cyan/amber edge light when active.
  - HP conduit: glass tube fill (green → yellow → red) with flow animation on change.
  - Letter count orbs: flex row of glowing dots that dim as letters are spent.

### Button system

- Update `components/ui/button.tsx` variants:
  - Primary = hexagonal silhouette using pseudo-elements (`::before`/`::after`).
  - Secondary = engraved stone bar with cyan inset line.
  - Icon buttons = circular coin with embossed icon + hover glow.

---

## Phase 3 · Polish

### Particle/ambient systems

- Cursor trail using canvas overlay (throttled, respects reduced-motion).
- Hover bursts for interactive elements (CSS `::after` with `scale` animation).
- Floating dust motes via absolutely positioned `div`s w/ `mix-blend-mode: screen`.

### Sigil panel

- Convert to circular arc layout:
  - Background: rotating glyphs (SVG mask).
  - Progress indicator: conic gradient fill w/ particle emitter near completion.
  - Activation: `Framer Motion` to run pulse + screen flash.

### Page + turn transitions

- Wrap Next route transitions with `framer-motion` layout animations.
- Add global `<AncientTransitionProvider>` to handle particle disperse-out / converge-in scenes.
- Turn change overlay: tinted gradient + "Your Turn" glyph that slides in/out.

---

## Phase 4 · Refinement

- **Audio hooks**: add event bus so SFX can hook into placement, damage, sigil events.
- **Performance**: gate heavy effects behind `prefers-reduced-motion` + `settings` toggle.
- **Accessibility**: ensure contrast ratios ≥ 4.5 where copy sits on textured surfaces, add alt text for glyph imagery, provide toggles for particle density.

---

### Next Steps Checklist

- [x] Migrate landing page hero + cards to new `.ancient-panel` styles.
- [x] Implement `GameBoard` stone surface + tile states (Phase 1 completion).
- [x] Introduce Framer Motion + animation hooks for letters (Phase 2 starter).
- [x] Build reusable particle utility (Phase 3).

