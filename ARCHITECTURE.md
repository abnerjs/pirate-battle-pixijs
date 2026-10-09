# Pirate Battle PixiJS - System Architecture & Technical Design Decisions

## 1. Overview
Pirate Battle is a 2D naval warfare arcade game built with **React 18**, **TypeScript** (strict mode), and **PixiJS v8**. Players navigate a custom pirate ship across an island archipelago, battle Chaser and Shooter enemy ships, manage cannon cooldowns, and compete on a global ranking board backed by MSW mock services and offline fallbacks.

---

## 2. Technology Stack & Architecture Layers

| Layer | Technology / Pattern | Key Responsibilities |
| :--- | :--- | :--- |
| **UI & Menus** | React 18, TailwindCSS, Radix UI | Main Menu, Options screen, Captain's Log (Ranking & History), Pause & Result Modals, Mobile Touch HUD |
| **Game Engine** | PixiJS v8 | 60 FPS 2D canvas rendering, scene graph, sprites, particles, delta-time ticker |
| **State Management** | Zustand (with Persist) | Game options (session time 60-180s, spawn interval, ship skin selection) |
| **Data / API** | TanStack Query v5, Axios, MSW v2 | Remote REST queries, mutations, background refetching, cache invalidation, and offline fallback |
| **Testing** | Vitest, Playwright | Unit math tests and comprehensive 12-scenario Playwright E2E test suite |

---

## 3. Core Architectural Decisions & Design Solutions

### A. 9-Slice Wooden UI Framework (`WoodenPanel` & `WoodenButton`)
- **Problem**: Scaling complex hand-drawn pirate wooden UI textures across varying screen sizes distorts corner artwork when using standard `background-size: cover/contain`.
- **Solution**: Implemented native CSS 9-slice rendering via `border-image-source: url('/assets/png/default/ui/menu/panel_menu.png')` with `border-image-slice: 112 fill`.
- **Responsive Borders**: On small mobile screens, side borders dynamically contract using CSS `clamp(32px, 8vw, 112px)` to maximize internal table width and eliminate wasteful lateral padding.

### B. Mobile Viewport & Safe-Area Responsiveness (`100dvh` & Insets)
- **Problem**: Mobile browsers (iOS Safari, Android Chrome) introduce dynamic address bar collapse, causing standard `100vh` layouts to obscure bottom touch HUD controls behind navigation bars.
- **Solution**: Enforced `100dvh` (Dynamic Viewport Height) across the main container, coupled with CSS `env(safe-area-inset-bottom)` and `env(safe-area-inset-right)` padding.
- **Mobile Captain's Log Table**: Replaced fixed pixel widths (`min-w-[466px]`) with responsive `w-full min-w-0 sm:min-w-[466px]`, formatted dates as `DD/MM/YY` on mobile viewports, and reduced cell padding to eliminate horizontal scrolling.

### C. PixiJS v8 Texture Masking & Z-Order Scene Graph
- **Problem**: Enemy health bar fill graphics were disappearing or being hidden under ship frames due to incorrect Z-ordering and PixiJS v8 texture masking changes.
- **Solution**: Established a clean container graph hierarchy inside `Ship` entities:
  1. Base hull & damage textures (`shipSprite`)
  2. Health bar background container (`healthContainer` at `zIndex = 100`)
  3. Red background bar & Green fill graphic
  4. Precise `Graphics` geometry mask (`fillBar.mask = maskGraphic`)
  5. Frame overlay on top (`healthFrameSprite`)
- This guarantees enemy health bars remain 100% visible, correctly proportioned, and dynamically updated during combat.

### D. 6-Ship Variant Texture Formula
- **Problem**: Selecting ships #5 or #6 fell back to ship #1 or #2 due to indexed texture sheet offset mismatches.
- **Solution**: Derived a deterministic variant mapping formula for $n \in \{1, 2, 3, 4, 5, 6\}$:
  $$\text{Variant } V = ((n - 1) \bmod 6) + 1$$
  $$\text{Atlas Index } shipIdx = V + 6 \cdot (damageLevel - 1)$$
  This guarantees ships 1 through 6 correctly display their distinct color hulls and progressive 4-stage damage states ($0\%$, $25\%$, $50\%$, $100\%$ destroyed).

### E. Offline Fallback Layer & MSW API Resilience (`src/api/queries.ts`)
- **Problem**: Network latency, MSW 500 errors, or timeout simulations could block users from saving match results or viewing rankings.
- **Solution**: Dual-layer architecture:
  - **Primary**: Axios client calls MSW REST API endpoints (`/api/ranking`, `/api/matches`).
  - **Fallback Layer**: If network queries fail or time out, `getOfflineRanking()` and `getOfflineMatchHistory()` combine MSW seed data with local `localStorage` records (`pirate_pending_matches`).
  - **Deduplication**: Pending matches are stored locally with unique IDs and synced upon recovery, ensuring **zero data loss** and **zero duplicate records**.

### F. Preloader Progress Callback & Loading Overlay (`src/game/asset-loader.ts`)
- **Problem**: Slow networks could delay loading PixiJS textures, causing game initialisation to hang or display missing textures.
- **Solution**: `preloadGameAssets(onProgress)` tracks loading progress across all texture assets and reports percentages to a React preloader overlay with a pirate progress bar before starting the ticker simulation.

### G. Pre-rendered Ship Sprite Assets (`ship_n.png`) vs Modular Sub-parts Optimization
- **Decision & Rationale**: Utilizing pre-rendered composite ship hull sprites (`ship_1.png` through `ship_6.png` across progressive 4-stage damage states) instead of dynamically assembling individual ship sub-part layers (sails, deck, cannons, hull fragments) at runtime.
- **Trade-off Benefits**:
  - **Significantly Reduced Sprite Graph Node Count**: Reduces the active PixiJS display object graph node count per ship entity from 10+ sub-sprites down to 1 primary composite sprite per entity, ensuring high frame-rate stability (60 FPS target) and low memory overhead.
  - **Accelerated Delivery & Zero Gameplay Impact**: Significantly sped up core development and delivery time without compromising gameplay mechanics, visual deterioration feedback, collision bounds, or user experience.

---

## 4. Game Engine Simulation & Mechanics

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                       │
│    (HUD Overlays, Main Menu, Options, Captain's Log)    │
└────────────────────────────┬────────────────────────────┘
                             │ Events / State
┌────────────────────────────▼────────────────────────────┐
│                  Game Engine Orchestrator               │
│                (src/game/game-engine.ts)                │
├────────────────────────────┬────────────────────────────┤
│   PixiJS Ticker Loop       │   Collision System (SAT)   │
│   (Delta Time Motion)      │   (Ship vs Island/Bullets) │
├────────────────────────────┼────────────────────────────┤
│   Procedural Island Map    │   Particle Effects System  │
│   (Chunk Generator)        │   (Explosions & Splashes)  │
└────────────────────────────┴────────────────────────────┘
```

### Motion & Deceleration Physics
- **Player Motion**: Keyboard (WASD/Arrows) and touch HUD buttons apply directional acceleration. Releasing controls initiates smooth 2.0-second deceleration decay (`deceleration = maxSpeed / 2.0`).
- **Camera Inertia**: Smooth exponential damping lerp ($1 - e^{-3 \cdot dt}$) produces realistic 1-second camera lag behind player movement.
- **Island Collisions**: Separating Axis Theorem (SAT) detects polygon collisions between ships and island land tiles, sliding ships smoothly along coastline boundaries.

### Combat System
- **Front Cannon (`Space`)**: High-velocity single cannonball.
- **Left Broadside (`Q`)**: 3-cannon spread salvo along left flank.
- **Right Broadside (`E`)**: 3-cannon spread salvo along right flank.
- **Enemy AI**:
  - **Chaser**: Directly pursues the player, detonates on impact for high area damage.
  - **Shooter**: Maintains attack distance, rotates toward player, and fires periodic cannonballs.

---

## 5. End-to-End (E2E) Playwright Test Suite (`e2e/pirate-battle.spec.ts`)

The solution includes automated Playwright tests covering all 12 scenarios outlined in the README:

1. **Options Navigation & Persistence**: Slider validations, options saving, page reload persistence check.
2. **Asset Loading Screen**: Preloader overlay and canvas initialization.
3. **Gameplay & Arena Limits**: Player movement, rotation, and island collision handling.
4. **Cannon Combat**: Frontal/broadside firing, cooldown timer displays, HUD score tracking.
5. **Enemy Spawning**: Verification of Chaser and Shooter enemy spawns.
6. **Match Termination**: Time/HP end triggers, result modal presentation, clean match restart.
7. **Pause & Resume**: Esc / HUD pause toggle, simulation suspension without timer jumps.
8. **Ship Selection & UI**: Main menu ship selector rotation and skin preview.
9. **Match Abandonment**: Returning to main menu mid-game without saving dirty scores.
10. **Captain's Log Pagination**: Tab switching (Ranking vs History) and page navigation.
11. **Match Submission & Querying**: Submitting results, MSW handler responses, table updates.
12. **Offline Fallback Layer**: LocalStorage recovery, network error resilience, pending queue sync.

---

## 6. Build & Verification Commands

```bash
# Code Quality & Format
npm run check:fix

# Run Unit Tests
npm run test

# Run Playwright E2E Suite
npm run test:e2e

# Production Build
npm run build
```
