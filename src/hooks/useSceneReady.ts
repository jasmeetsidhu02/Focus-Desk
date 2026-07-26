import { useProgress } from "@react-three/drei";
import { useState } from "react";

/**
 * True once the scene's assets have finished loading, and true forever
 * after.
 *
 * `useProgress` is a zustand store that drei wires to three's
 * DefaultLoadingManager, so it works outside the Canvas — which is the
 * whole point here: the DOM chrome sits outside the Canvas and still needs
 * to know when the room has arrived.
 *
 * Sticky on purpose. Anything loaded later (a lazily-fetched model, a
 * texture) flips `active` back to true, and the nav disappearing
 * mid-session would be a strange thing to watch.
 */
export function useSceneReady() {
  // Selector form rather than destructuring the whole store: this only
  // re-renders when these two values change, not on every progress tick.
  const active = useProgress((state) => state.active);
  const total = useProgress((state) => state.total);

  const [ready, setReady] = useState(false);

  // `active` starts false — it's the store's initial state, before the
  // loading manager has been handed anything. So "not active" on its own
  // would report ready on the very first render, which is the opposite of
  // the truth. `total > 0` means at least one asset has been registered,
  // which only happens once loading has actually begun.
  //
  // Set during render rather than in an effect: an effect would commit a
  // frame with the old value first, which is exactly the flash of
  // prematurely-visible chrome this hook exists to prevent.
  if (!ready && !active && total > 0) {
    setReady(true);
  }

  return ready;
}
