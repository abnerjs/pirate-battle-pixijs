# 🏴‍☠️ Pirate Battle — React & PixiJS Naval Arcade Game

A 2D top-down naval shooter game built with **React 18**, **TypeScript** (strict mode), and **PixiJS v8**. Players navigate a pirate ship across procedural island archipelagos, battle Chaser and Shooter enemy ships, manage cannon broadsides, and compete on a global ranking leaderboard backed by MSW mock services and offline fallbacks.

---

## 🚀 Quick Setup & Installation

### Prerequisites
- **Node.js**: v18.19.0 or higher
- **npm**: v9.0.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/abnerjs/pirate-battle-pixijs.git
cd pirate-battle-pixijs

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🕹️ Game Controls

### Keyboard Controls (Desktop)
| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| **Accelerate / Sail** | `W` | `Up Arrow` |
| **Steer Left** | `A` | `Left Arrow` |
| **Steer Right** | `D` | `Right Arrow` |
| **Decelerate** | `S` | `Down Arrow` |
| **Front Cannon** | `Space` | Touch Button |
| **Left Broadside (3 Cannons)** | `Q` | Touch Button |
| **Right Broadside (3 Cannons)**| `E` | Touch Button |
| **Pause Match** | `Esc` / `P` | HUD Pause Icon |

### Touch Controls (Mobile)
- On mobile devices and touchscreens, an arcade HUD overlay appears with touch-optimized buttons for steering and firing cannons.
- Supports dynamic viewport height (`100dvh`) and safe-area insets (`env(safe-area-inset-bottom)`).

---

## ⚙️ Gameplay Configuration

The game balance can be adjusted on the **Options** screen from the Main Menu. Settings are stored in `localStorage` and persisted across sessions:

- **Game Session Time**: Configurable between **60s, 90s, 120s, 150s, or 180s**.
- **Enemy Spawn Interval**: Configurable between **1.5s, 3.0s, or 5.0s**.
- **Ship Selection**: Select from 6 distinct pirate ship hull skins directly from the Main Menu.

---

## 🌐 Network Scenario Selection & Failure Simulation (MSW)

The project uses **MSW (Mock Service Worker)** to simulate REST API endpoints (`/api/ranking` and `/api/matches`).

### Toggling Network Scenarios
Press `Ctrl + Shift + D` (or `Cmd + Shift + D` on macOS) at any time to cycle through active network test scenarios:

1. **ONLINE (200 OK)**: Normal fast API responses.
2. **EMPTY DATA**: Returns empty data arrays to test empty UI state handling.
3. **LATENCY (+2s)**: Introduces a 2-second delay to test loading spinners.
4. **DELAYED POST (+3s)**: Delays match submission by 3 seconds.
5. **SERVER ERROR (500)**: Simulates 500 Internal Server Error (triggers offline fallback).
6. **NETWORK TIMEOUT (504)**: Simulates gateway timeout (triggers pending match queue).

### Offline Fallback Layer & Error Recovery
- If the MSW server responds with an error or timeout, the game uses an offline `localStorage` fallback layer (`pirate_pending_matches`).
- Matches completed while offline are queued locally and synced automatically when the network recovers, ensuring **zero data loss** and **idempotent submission without duplicates**.

---

## 🛠️ CLI Commands & Verification

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server at `http://localhost:5173` |
| `npm run build` | Runs TypeScript type checking (`tsc -b`) and builds Vite production bundle |
| `npm run preview` | Serves production build locally |
| `npm run check:fix` | Runs Biome code formatting and linter auto-fixes |
| `npm run lint` | Runs ESLint code check |
| `npm run test` | Runs Vitest unit test suite |
| `npm run test:e2e` | Runs Playwright End-to-End test suite across Chromium Desktop & Mobile |

---

## 🧪 Playwright End-to-End (E2E) Testing

The test suite covers all 12 requirement scenarios:

```bash
# Execute Playwright E2E tests
npm run test:e2e
```

E2E coverage includes Options persistence, preloader asset loading, movement physics, cannon firing, enemy AI spawns, match pause/resume, match result persistence, Captain's Log pagination, MSW endpoint integration, and offline fallback queues.

---

## 📐 Architecture & Design Reference

For detailed documentation on the React/PixiJS integration, 9-slice wooden UI scaling, collision system (SAT), 6-ship variant formula, and scene graph Z-ordering, see [`ARCHITECTURE.md`](ARCHITECTURE.md).
