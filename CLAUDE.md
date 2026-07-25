# Focus Desk — Interactive 3D Scene

## What this is
A personal portfolio project: an interactive 3D desk scene built with **React + TypeScript + Three.js**. The user clicks objects on a desk (laptop, mug, plant, notebook, lamp) and an info panel shows details about each one. The desk lamp also acts as a light/dark toggle for the whole scene's lighting.

## Why this project exists
The developer (React/frontend + game dev, experienced with Cocos Creator and some React Three Fiber at work) wants to:
1. Deepen core React fundamentals — hooks, custom hooks, effect cleanup, state vs. ref usage
2. Have one project that is **fully self-owned** (not client work under NDA) that can be shown as real, inspectable code in interviews
3. Produce something portfolio-ready: deployable live + open on GitHub

**This is a learning project.** Prioritize teaching/explaining the "why" behind patterns, not just producing working code. Implement it step by step, confirming each step renders/works before moving to the next — do not jump ahead or scaffold multiple steps at once unless explicitly asked.

## Tech stack
- React 18 + TypeScript
- Vite (build tool)
- `three` + `@react-three/fiber` (React renderer for Three.js — components map to Three.js objects, `<Canvas>` owns the scene/camera/renderer/animation-loop lifecycle)
- `zustand` (real package, used directly — no more hand-rolled store)
- No CSS framework required — keep styling simple and intentional (see Design notes below)

> Originally this project hand-rolled Three.js (raw `three`, imperative scene setup in a `useEffect`) and a Zustand-style store on `useSyncExternalStore`, because `@react-three/fiber`/`zustand` weren't available in the environment the plan was drafted in. Swapped to the real libraries once they became available — the sections below describe the current (R3F) architecture.

## Architecture

### State shape (global, minimal)
```
hoveredId: string | null      // object currently under the pointer
selectedId: string | null     // object whose info panel is open
lightsOn: boolean             // lamp toggle — controls scene lighting
```
Everything else (object positions, colors, titles, descriptions) is **static data**, not state — lives in a plain array (see `src/data/objects.ts`), not in `useState`.

### State management pattern
A real Zustand store (`src/store/useSceneStore.ts`), created with `create()` from the `zustand` package. Same minimal state shape as above, plus actions (`setHovered`, `setSelected`, `toggleLights`) that components call directly. No Context/Provider needed — that's the point of Zustand: any component can `import { useSceneStore } from '...'` and select just the slice of state it needs.

### Components
- **`<App />`** — composes `<Scene3D />` and `<InfoPanel />`, nothing else
- **`<Scene3D />`** — renders an R3F `<Canvas>`. Camera, lights, and desk objects are all JSX (`<PerspectiveCamera>`, `<ambientLight>`, `<mesh>`, etc.) — declarative, not manual `THREE.Scene()`/`THREE.WebGLRenderer()` setup. `<Canvas>` owns the render loop and disposal internally; there is no manual `useEffect` scene-setup/teardown to write for the base scene anymore.
- **`<DeskObject />`** (or similar, one per clickable mesh) — reads its static data (position, geometry, id) as props, renders a `<mesh>` with R3F's built-in pointer event props (`onPointerOver`, `onPointerOut`, `onClick`) wired to store actions.
- **`<InfoPanel />`** — plain React/HTML (no Three.js). Reads `selectedId` from the store, looks up the matching object's static data, renders title + description. Slides in/out based on whether `selectedId` is set. Includes a close button that clears `selectedId`.

### Custom hooks to extract
- No `useThreeScene` needed anymore — `<Canvas>` replaces it (this is worth being able to explain: what R3F's `<Canvas>` is doing for you under the hood — scene graph reconciliation, render loop, resize handling, disposal on unmount).
- No manual `useRaycaster` needed — R3F does its own raycasting per-frame against interactive meshes and exposes it as `onPointerOver`/`onPointerOut`/`onClick`/etc. props, so hover/click detection becomes event props instead of hand-rolled `THREE.Raycaster` calls.
- Still worth a small custom hook if hover-highlight logic (looking up "am I the hovered/selected mesh" and deriving an emissive color) gets reused across every `<DeskObject />` — e.g. `useIsHighlighted(id)`.

### The core technical pattern (the interesting part)
With raw Three.js the bridge between imperative rendering and declarative React was a manually-written effect. R3F moves that seam *into* the reconciler — JSX describes the scene graph, and React's diffing decides what Three.js calls to make. The interesting pattern now is:
1. Mesh pointer events (`onPointerOver` / `onPointerOut` / `onClick`) call Zustand store actions (`setHovered`, `setSelected`) directly — no manual raycaster wiring.
2. Each `<DeskObject />` reads `hoveredId`/`selectedId` from the store and **derives** whether it's highlighted, passing that into its material's `emissive` prop declaratively — vs. the old plan's imperative "reach into the mesh and mutate `.emissive` in an effect."
3. This is worth being explicit about in an interview: the raw-Three.js version required an effect as the seam between imperative and declarative worlds; R3F's reconciler *is* that seam, so the app-level code stays declarative all the way down — but it's still useful to know what's happening underneath (why over-subscribing to store state causes extra re-renders, when you'd reach for `useFrame` + refs instead of props for perf-sensitive per-frame mutation).

## Scene objects (static data — `src/data/objects.ts`)
| id | label | notes |
|---|---|---|
| laptop | Laptop | "what I'm working on" blurb, could link to GitHub |
| mug | Coffee Mug | light/fun one-liner |
| plant | Desk Plant | light/fun one-liner |
| book | Notebook | could show real project ideas/TODOs |
| lamp | Desk Lamp | **also toggles `lightsOn`** — clicking it changes scene lighting, not just opens a panel |

Optional 6th object (not required for v1): a picture frame / monitor showing an "About Me" blurb, so the scene can double as a portfolio landing page rather than living only in a "Projects" tab.

## Design notes
Moody desk-lamp-lit scene — the lamp is meant to read as the actual light source. Avoid generic "AI demo" aesthetics (no cream-background-plus-terracotta-accent, no near-black-plus-neon-green). Pick a small, deliberate palette (4–6 colors) that fits a warm evening workspace and stay consistent with it in both the 3D materials and the `InfoPanel` UI styling.

## Build order (follow in this order, confirm each step works before continuing)
1. ✅ Project scaffolded: Vite + React + TypeScript
2. ✅ Installed `three`, `@types/three`, `@react-three/fiber`, `zustand`
3. ✅ Cleared CRA/Vite boilerplate from `App.tsx`
4. **Current step:** Create `Scene3D.tsx` with a minimal R3F scene: `<Canvas>`, one light, one plain `<mesh>` with `<boxGeometry>`. No manual render loop or cleanup effect to write — `<Canvas>` handles mount/unmount lifecycle itself. No desk objects yet — just prove `<Canvas>` mounts and renders.
5. Replace the single box with the actual desk group + all 5 scene objects from the data file (as `<DeskObject />` components), positioned per the table above. Still no interactivity.
6. Add hover detection: wire `onPointerOver`/`onPointerOut` on each mesh, log the hovered id to console first before wiring any visual change.
7. Wire hover to a visual highlight (emissive color change on the hovered mesh, reset on the previous one) — derived declaratively from store state.
8. Add click detection (`onClick` on each mesh) → sets `selectedId` in the store.
9. Build `<InfoPanel />` — reads `selectedId`, displays the matching object's title/description, slide-in/out transition, close button.
10. Wire the lamp object specifically to also toggle `lightsOn`, and have `Scene3D` react to that (swap light intensity/color, maybe swap a background color/fog).
11. Polish pass: hover cursor styling, responsive canvas sizing (R3F's `<Canvas>` handles resize automatically, but verify), reduced-motion consideration, mobile check.
12. Deploy (Vercel/Netlify) + push to GitHub with a clean README + add live link to portfolio and resume.

## Working style for this project
- Implement **one step at a time**. After each step, describe what to check/confirm visually before moving on.
- Prefer explaining *why* a pattern is used (especially around hooks, effect cleanup, and the imperative/declarative bridge) over just producing code silently — this is a learning project first, a portfolio piece second.
- Don't introduce libraries beyond what's listed in Tech stack without asking first.
