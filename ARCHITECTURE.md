# Pirate Battle PixiJS - System Architecture & E2E Guide

## 1. Overview
Pirate Battle is a 2D naval warfare arcade game built with React 18, TypeScript, and PixiJS v8. Players navigate a custom-selected pirate ship across an island archipelago, engaging in cannon combat, avoiding island obstacles, and competing for top high scores in single-player sessions.

---

## 2. Technology Stack & Principles

| Layer | Technology / Pattern | Key Responsibilities |
| :--- | :--- | :--- |
| **UI Layer** | React 18, TailwindCSS | HUD overlays, Main Menu, Options, Captain's Log, Pause Modal |
| **Game Engine** | PixiJS v8 | 60 FPS 2D canvas rendering, scene graph, sprites, particles, ticker |
| **State Management** | Zustand (with Persist) | Game options (session time, spawn rate, selected ship avatar) |
| **Data / API** | TanStack Query, Axios, MSW | REST API layer for submitting matches, ranking board, match history |
| **File Naming Standard** | `kebab-case` | All files under `src/game/` use strict kebab-case naming |

---

## 3. Directory Structure

```
src/
├── api/                   # API clients & TanStack Query mutations/queries
├── components/            # React UI Components
│   ├── game/              # GameView HUD & Pause Modal overlays
│   ├── menu/              # MainMenu, OptionsScreen, CaptainsLog, Wooden Panel/Button
│   └── ui/                # Shared UI primitives (WoodenPanel, WoodenButton, RoundedButton)
├── game/                  # PixiJS Game Engine Core (STRICT KEBAB-CASE)
│   ├── config/            # Game balance configuration & constants
│   ├── effects/           # Particle effects manager (explosions, water splashes)
│   ├── entities/          # Game entities (Ship, PlayerShip, ChaserEnemy, ShooterEnemy, Projectile)
│   ├── input/             # Keyboard & touch control handlers
│   ├── map/               # Procedural island & ocean tile map generator
│   ├── asset-loader.ts    # PixiJS v8 texture asset preloader
│   └── game-engine.ts     # Main PixiJS Application orchestrator & loop
├── lib/                   # Zustand stores & sound manager utilities
├── mocks/                 # MSW mock handlers & seed fixtures
├── types/                 # TypeScript interface & type definitions
└── app.tsx                # Main App entry point
```

---

## 4. Game Engine Architecture & Camera System

### Asset Preloader (`src/game/asset-loader.ts`)
In PixiJS v8, textures must be loaded into the `Assets` cache prior to creating `Sprite` instances to prevent empty placeholder rendering.
- `preloadGameAssets()` asynchronously loads ocean tile `tile_73.png`, island tiles, ship sprites, and particle effects before game scene initialization.

### Physics, Deceleration & Camera Inertia System
- **2-Second Deceleration Physics (`src/game/entities/player-ship.ts`)**: Releasing the forward key does not instantly stop the ship. Instead, naval momentum decays current speed linearly to 0 over exactly 2.0 seconds (`deceleration = maxSpeed / 2.0`). Obstacle collisions dampen remaining speed smoothly.
- **1-Second Camera Inertia (`src/game/game-engine.ts`)**: The camera follows the player with a 1-second inertia delay (smooth damping lerp `1 - exp(-3 * dt)`). When the ship changes speed or heading, the camera smoothly lags behind and catches up to match the ship's velocity after 1 second of steady movement.
- **Dynamic Resize Without Game Reset**: A `ResizeObserver` monitors the container `div`. When the window/viewport resizes, `GameEngine.resize(width, height)` dynamically resizes the PixiJS renderer buffer and updates the camera viewport instantly without restarting the match or losing state.

- **Procedural Infinite Chunk Manager (`src/game/map/chunk-manager.ts`)**:
  - **Infinite 360° World Movement**: Ships (`PlayerShip`, `ChaserEnemy`, `ShooterEnemy`) and projectiles (`Projectile`) move without boundary limits in all directions (including negative `x` and `y` coordinates).
  - **Quadrupled Island Density**: Runs up to 8 procedural island placement attempts per chunk (~85% probability per attempt), dense archipelago generation while enforcing strict 4-tile distance gap rules.
  - **Percentage Damage State System ($n \in \{1, 2, 3, 4\}$)**: Dynamic ship textures update based on lost HP percentage:
    - $n = 1$: 0% damage / 100% HP (sem dano)
    - $n = 2$: 25% ou mais de dano ($25\% \le \text{dano} < 50\%$)
    - $n = 3$: 50% ou mais de dano ($50\% \le \text{dano} < 100\%$)
    - $n = 4$: 100% dano / 0 HP (morreu, não anda mais)
  - **Result Modal Redesign (`src/components/menu/result-modal.tsx`)**: Formatted using standard `WoodenPanel` (9-slice wood frame). Displays fixed header `"Battle complete"`, final score in matching text size, `text-sm` time and end reason (`Time Up` or `Ship Destroyed`), and primary wooden buttons (`PLAY AGAIN` & `MAIN MENU`).
  - **Deterministic Coordinate PRNG (`seedRandom(cx, cy)`)**: Each chunk uses a 32-bit coordinate-seeded pseudo-random number generator to ensure world consistency across visits.
  - **Ocean Water Base Layer**: Tiled ocean background per chunk using `/assets/png/default/tiles/tile_73.png` scaled 2x to `256px` (`oceanTileSize = 256px`) for expansive, smooth ocean rendering.
  - **Thick Island Shape Constraint**: All procedural island patterns are generated from solid 2D blocks with procedurally carved corner steps, enforcing a minimum thickness of 2+ tiles everywhere (no thin 1-tile strips or hollow ring shapes).
  - **Minimum 4-Tile Gap Constraint Across Chunks**: Every island placement enforces a strict minimum distance buffer of at least 4 tiles between land cells of any two islands across chunk boundaries (1 submerged border tile for Island A + 1 submerged border tile for Island B + 2 open ocean water tiles in between), ensuring open navigable channels for naval combat.
  - **Submerged Island Base Layer (Ilha Submersa sob Toda a Ilha)**:
    - **Under All Land Cells**: Rendered with full submerged shallow water tile (`tile_27`) beneath all land sprites.
    - **Coastal Water Border Ring**: Rendered on top of ocean tile 73 around island coastlines:
      - Outer Corners: `tile_10` (TL), `tile_12` (TR), `tile_42` (BL), `tile_44` (BR).
      - Straight Edges: `tile_11` (T), `tile_26` (L), `tile_28` (R), `tile_43` (B).
      - Gulf / Cove Full Submerged Water: `tile_27` (water cell surrounded by 3+ land sides).
      - Inner Bend Companions: `tile_75` (TL bend), `tile_74` (TR bend), `tile_59` (BL bend), `tile_58` (BR bend).
  - **Sandy Island Autotiling (`type: 'sand'`)**: Smaller procedural islands (3-5 tiles wide/tall):
    - Outer Convex Corners: `tile_1` (TL), `tile_3` (TR), `tile_33` (BL), `tile_35` (BR).
    - Straight Edges: `tile_2` (T), `tile_17` (L), `tile_19` (R), `tile_34` (B).
    - Inner Concave Bends (Dobras de Canto): `tile_21` (TL), `tile_20` (TR), `tile_5` (BL), `tile_4` (BR).
    - Inner Sand Fill: `tile_18` (pure sand) and `tile_68`, `tile_69` (sand with pebbles).
    - Special Details (sparse, max 1 per island): `tile_81` (shipwreck), `tile_83` (war wreckage), `tile_85` (large rock), dynamically rotated (0°, 90°, 180°, 270°) to match edge orientation.
  - **Grass Island Autotiling (`type: 'grass'`)**: Larger procedural islands (5-7 tiles wide/tall):
    - Outer Convex Corners: `tile_6` (TL), `tile_9` (TR), `tile_54` (BL), `tile_57` (BR).
    - Straight Edges: `tile_7`/`tile_8` (T), `tile_22` (L), `tile_25`/`tile_41` (R), `tile_55`/`tile_56` (B).
    - Inner Concave Bends (Dobras de Canto): `tile_53` (TL), `tile_52` (TR), `tile_37` (BL), `tile_36` (BR).
    - Inner Grass Fill: `tile_23` (grass), `tile_24` (grass with flowers), `tile_39`/`tile_40` (grass with medium bushes).
    - Special Details (sparse, max 1 per island): `tile_82` (shipwreck), `tile_84` (war wreckage), `tile_86` (large rock), dynamically rotated to match edge orientation.
  - **2x Map Scaling**: Land and submerged tiles are rendered at `tileSize = 128px` (2x scale), while player and enemy ships remain at standard scale.

### Combat & Weapon System (`src/game/entities/player-ship.ts`)
- **Front Cannon (Space)**: Single long-range forward projectile.
- **Left Broadside (Q)**: 3-cannon barrage fired perpendicular to left flank.
- **Right Broadside (E)**: 3-cannon barrage fired perpendicular to right flank.

### HUD Layout, Tutorial Prompts & Cooldown Visualization (`src/components/game/game-view.tsx` & `src/game/entities/player-ship.ts`)
- **No Floating Health Bar on Player Ship (`src/game/entities/ship.ts`)**: The floating health bar above the ship is rendered exclusively for enemy ships. The player ship remains clean, with hull health tracked visually in the top-left HUD.
- **3-Second Match Start Tutorial Prompts**: For the first 3 seconds of each match, 3 pulsing disabled `<RoundedButton>` key prompts appear attached around the player ship:
  - **Front**: `SPACE` (Space key for Front Cannon) on wooden round button texture, spaced 90px ahead of the bow.
  - **Left**: `Q` (Q key for Left Broadside) on wooden round button texture, spaced 90px on the left flank.
  - **Right**: `E` (E key for Right Broadside) on wooden round button texture, spaced 90px on the right flank.
  - **Text Color**: Uses light theme secondary color (`#f5e6ca` / `0xf5e6ca` cream gold) with a dark outline for high contrast on the wooden button texture.
  - **Animation**: Prompts pulse in scale (`1.0 + Math.sin(t * 8) * 0.12`) and smoothly fade out during the final 0.5s of the 3-second tutorial window.
- **Top Left Hull Health**: Features a standalone `icon_heart.png` paired with `health_frame.png` and a centered inner `health_fill_green.png` bar.
- **Top Right Header Controls**: Separate `CounterPanel` components for Score (`icon_score.png`) and Time (`icon_time.png`) rendered using 9-slice `counter_panel.png`, plus a circular wooden `<RoundedButton>` for Pause.
- **Bottom Control Groups**: Wrapper background panels removed. Buttons are scaled to 80% of original size (44px `w-11 h-11`, adhering to the 4px grid scale) with reduced gap.
- **50% Elevation for Center Buttons**: The center button in both the steering group (Forward) and attack group (Front Cannon) is elevated 50% upward (`-translate-y-[22px]`).
- **Keyboard State Synchronization**: Pressing keyboard keys (WASD, Arrows, Space, Q, E) dynamically highlights and triggers the `isPressed` state on the corresponding HUD buttons.
- **Circular Pie Chart Cooldown Overlay**: Cooldown timers are visualized as a circular radial pie-chart overlay (`conic-gradient`), displaying a shrinking dark overlay and numeric countdown until weapons are ready.
- **No Text Legends**: Text legends on attack buttons have been removed for a clean arcade HUD presentation.

## 5. End-to-End (E2E) Testing Strategy

To ensure seamless integration and stability across UI, PixiJS Canvas, and API mock layers:

### 1. Deterministic Testing Mode (`isTestingMode`)
- `GameEngine.isTestingMode = true` allows E2E automated tests to verify player steering, cannon fire, and map rendering without premature enemy damage or match timer expiration.

### 2. UI Component Selectors & Accessibility
- Interactive elements (`PLAY`, `OPTIONS`, `RANKING`, `PAUSE`) maintain descriptive button titles, text labels, and clean DOM hierarchy for automated browser agents.

### 3. API Mock Isolation
- Mock Service Worker (`msw`) mocks all `/api/ranking` and `/api/matches` endpoints locally, ensuring zero dependency on external backends during E2E runs.

---

## 6. Development & Build Verification

- **Lint & Formatter**: `npm run check:fix` (Biome)
- **Production Build**: `npm run build` (`tsc -b && vite build`)
- **Dev Server**: `npm run dev` (`http://localhost:5173`)
