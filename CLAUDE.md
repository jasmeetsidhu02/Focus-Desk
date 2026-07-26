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
- `@react-three/drei` (R3F helper components — currently used for `<OrbitControls />`)
- `@reduxjs/toolkit` + `react-redux` (Redux Toolkit — `configureStore`, `createSlice`; `react-redux`'s `<Provider>`, `useSelector`, `useDispatch`)
- No CSS framework required — keep styling simple and intentional (see Design notes below)

> Originally this project hand-rolled Three.js (raw `three`, imperative scene setup in a `useEffect`) and a Zustand-style store on `useSyncExternalStore`, because `@react-three/fiber`/`zustand` weren't available in the environment the plan was drafted in. Swapped to real `@react-three/fiber` once it became available. State management was later swapped again from Zustand to Redux Toolkit (deliberate choice, not an availability constraint — RTK is the more commonly-required skill in job listings, and this is a resume project) — nothing had been built against Zustand yet, so it was a clean swap. The sections below describe the current (R3F + Redux Toolkit) architecture.

## Architecture

### State shape (global, minimal)
```
hoveredId: string | null      // object currently under the pointer
selectedId: string | null     // object whose info panel is open
lightsOn: boolean             // lamp toggle — controls scene lighting
```
Everything else (object positions, colors, titles, descriptions) is **static data**, not state — lives in a plain array (see `src/data/objects.ts`), not in `useState`.

### State management pattern
A Redux Toolkit store:
- **`src/store/sceneSlice.ts`** — one slice, created with `createSlice()`, holding the state shape above plus reducers (`setHovered`, `setSelected`, `toggleLights`). RTK lets these reducers be written as if directly mutating `state` (`state.hoveredId = id`) — under the hood it uses Immer to turn that into a proper immutable update. Worth being able to explain *why* that's safe (Immer produces a new object via a proxy, it doesn't actually mutate the original) since it looks like it breaks Redux's core immutability rule.
- **`src/store/store.ts`** — `configureStore({ reducer: { scene: sceneReducer } })`.
- **`src/store/hooks.ts`** — typed `useAppSelector`/`useAppDispatch` wrapper hooks (the standard RTK + TypeScript convention, so components don't need to repeat `useSelector<RootState>` everywhere).

Unlike Zustand, Redux **does** need a Provider: `<Provider store={store}>` wraps `<App />` in `main.tsx`. Components read state via `useAppSelector(state => state.scene.hoveredId)` and dispatch actions via `useAppDispatch()` + `dispatch(setHovered(id))`.

### Components
- **`<App />`** — composes `<Scene3D />` and `<InfoPanel />`, nothing else. (The `<Provider>` wraps `<App />` one level up, in `main.tsx` — kept out of `App` itself.)
- **`<Scene3D />`** — renders an R3F `<Canvas>`. Camera, lights, and desk objects are all JSX (`<PerspectiveCamera>`, `<ambientLight>`, `<mesh>`, etc.) — declarative, not manual `THREE.Scene()`/`THREE.WebGLRenderer()` setup. `<Canvas>` owns the render loop and disposal internally; there is no manual `useEffect` scene-setup/teardown to write for the base scene anymore.
- **`<DeskObject />`** (one per clickable mesh) — reads its static data (position, geometry, id) as props, renders a `<mesh>` with R3F's built-in pointer event props (`onPointerOver`, `onPointerOut`, `onClick`) wired to `dispatch(...)` calls.
- **`<InfoPanel />`** — plain React/HTML (no Three.js). Reads `selectedId` via `useAppSelector`, looks up the matching object's static data, renders title + description. Slides in/out based on whether `selectedId` is set. Includes a close button that dispatches `setSelected(null)`.

### Custom hooks to extract
- No `useThreeScene` needed anymore — `<Canvas>` replaces it (this is worth being able to explain: what R3F's `<Canvas>` is doing for you under the hood — scene graph reconciliation, render loop, resize handling, disposal on unmount).
- No manual `useRaycaster` needed — R3F does its own raycasting per-frame against interactive meshes and exposes it as `onPointerOver`/`onPointerOut`/`onClick`/etc. props, so hover/click detection becomes event props instead of hand-rolled `THREE.Raycaster` calls.
- **`useAppSelector`/`useAppDispatch`** (`src/store/hooks.ts`) — the typed Redux hooks every component uses instead of the raw `react-redux` ones.
- Still worth a small custom hook if hover-highlight logic (looking up "am I the hovered/selected mesh" and deriving an emissive color) gets reused across every `<DeskObject />` — e.g. `useIsHighlighted(id)`.

### The core technical pattern (the interesting part)
With raw Three.js the bridge between imperative rendering and declarative React was a manually-written effect. R3F moves that seam *into* the reconciler — JSX describes the scene graph, and React's diffing decides what Three.js calls to make. The interesting pattern now is:
1. Mesh pointer events (`onPointerOver` / `onPointerOut` / `onClick`) `dispatch()` Redux actions (`setHovered`, `setSelected`) directly — no manual raycaster wiring.
2. Each `<DeskObject />` reads `hoveredId`/`selectedId` via `useAppSelector` and **derives** whether it's highlighted, passing that into its material's `emissive` prop declaratively — vs. the old plan's imperative "reach into the mesh and mutate `.emissive` in an effect."
3. This is worth being explicit about in an interview: the raw-Three.js version required an effect as the seam between imperative and declarative worlds; R3F's reconciler *is* that seam, so the app-level code stays declarative all the way down — but it's still useful to know what's happening underneath (why over-subscribing to store state causes extra re-renders, when you'd reach for `useFrame` + refs instead of props for perf-sensitive per-frame mutation).
4. Also worth being explicit about: Redux's single global store + dispatched actions (vs. Zustand's direct store-object mutation calls) is a genuinely different mental model — actions are named, serializable events (`setHovered('lamp')`) rather than direct function calls, which is *why* Redux DevTools can show a time-travel-able action log. Good to be able to contrast the two approaches, not just know Redux's syntax.

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
2. ✅ Installed `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `@reduxjs/toolkit`, `react-redux`
3. ✅ Cleared CRA/Vite boilerplate from `App.tsx`
4. ✅ Minimal R3F scene in `Scene3D.tsx`: `<Canvas>`, `<OrbitControls>`, one `<ambientLight>`, one box mesh. Full-page canvas sizing fixed (`#root` needed a *definite* `height`, not `min-height`, for R3F's `height: 100%` wrapper div to resolve).
5. ✅ Replaced the single box with all 5 scene objects: `src/data/objects.ts` (static data) + `<DeskObject />` (renders geometry/color per object) mapped from `Scene3D`.
6. ✅ Hover detection — `onPointerOver`/`onPointerOut` wired on `<DeskObject />`'s mesh.
7. ✅ Redux Toolkit store (`src/store/sceneSlice.ts`, `store.ts`, `hooks.ts`), `<App />` wrapped in `<Provider>`, hover dispatches `setHovered(...)`.
8. ✅ Hover highlight — `emissive`/`emissiveIntensity` on `<DeskObject />`'s material, derived from `hoveredId` via `useAppSelector`.
9. ✅ Click detection (`onClick` on each mesh) → `dispatch(setSelected(id))`.
10. ✅ `<InfoPanel />` — reads `selectedId`/looks up the object, slide-in/out via CSS transform + class toggle (not conditional mount), close button dispatches `setSelected(null)`.
11. ✅ Lamp click also dispatches `toggleLights()`. `Scene3D` reacts: `pointLight` positioned at the lamp's location (derived from `sceneObjects`, not duplicated coordinates), `ambientLight` intensity and background color both swap based on `lightsOn`. A `PointLightHelper` (via drei's `useHelper`) is temporarily visible for tuning position/intensity — remove once satisfied.
12. ✅ Polish pass — hover cursor styling (`document.body.style.cursor` in the pointer handlers), reduced-motion (`prefers-reduced-motion` strips the `InfoPanel` transition), debug `PointLightHelper` removed, `onPointerMissed` on `<Canvas>` clears `selectedId`/`hoveredId` when clicking empty space (also defends against the touch "stuck hover glow" case, since a tap has no reliable pointer-out). Responsive canvas sizing and an on-device mobile/touch check are verification items, not code — still worth doing but nothing to write until they surface an actual bug.
13. **Current step:** Deployed to Netlify: https://jasmeetdesk.netlify.app/. README rewritten with a real project description, live link, tech stack, and "why it's built this way" section (still needs to be committed). Remaining: add the live link to portfolio site + resume (outside this repo).

## Working style for this project
- Implement **one step at a time**. After each step, describe what to check/confirm visually before moving on.
- Prefer explaining *why* a pattern is used (especially around hooks, effect cleanup, and the imperative/declarative bridge) over just producing code silently — this is a learning project first, a portfolio piece second.
- Don't introduce libraries beyond what's listed in Tech stack without asking first.
