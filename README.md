# Focus Desk

An interactive 3D desk scene built with React, TypeScript, and Three.js. Click around the desk — laptop, coffee mug, plant, notebook, and lamp — to see details about each one. The lamp doubles as a light switch for the whole scene.

**Live demo:** [jasmeetdesk.netlify.app](https://jasmeetdesk.netlify.app/)

## Features

- Hover any object to highlight it, click to open a sliding info panel with details
- Click the desk lamp to toggle the scene between a lit and a dark, moody state — ambient light, a point light at the lamp, and the background color all shift together
- Orbit controls to look around the scene
- Click empty space (or the panel's close button) to dismiss the info panel

## Tech stack

- **React 19 + TypeScript** — component structure, hooks, typed state
- **Vite** — dev server and build tooling
- **Three.js + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)** — declarative Three.js scene, driven by JSX instead of imperative scene/renderer setup
- **[@react-three/drei](https://github.com/pmndrs/drei)** — `OrbitControls`
- **Redux Toolkit + react-redux** — global state (`hoveredId`, `selectedId`, `lightsOn`) via a single slice, with typed `useAppSelector`/`useAppDispatch` hooks

## Why it's built this way

Scene objects (position, geometry, color, label, description) are static data (`src/data/objects.ts`), not React state — they never change at runtime, so there's no reason to put them in a store. Actual state is limited to the three values that genuinely change: which object is hovered, which is selected, and whether the lights are on.

Interaction is handled through R3F's pointer events (`onPointerOver`/`onPointerOut`/`onClick`) directly on each mesh, which dispatch Redux actions — no manual `THREE.Raycaster` wiring needed, since R3F's reconciler does that internally and exposes the result as ordinary-looking event props.

## Running locally

```bash
git clone https://github.com/jasmeetsidhu02/Focus-Desk.git
cd Focus-Desk
npm install
npm run dev
```

Other scripts:

```bash
npm run build    # type-check + production build
npm run lint      # eslint
npm run preview   # preview the production build locally
```
