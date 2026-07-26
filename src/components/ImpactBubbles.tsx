import { Html } from "@react-three/drei";
import { useEffect } from "react";
import type { ImpactBubble } from "../types";
import "./ImpactBubbles.css";

// Long enough to read, short enough that a rapid-fire spree doesn't turn
// into a wall of emoji. Kept in step with the CSS animation duration below.
const BUBBLE_LIFETIME_MS = 1200;

// Lifts the bubble off the floor so it starts at about letter height
// rather than clipping into the ground plane.
const BUBBLE_LIFT = 0.14;

interface ImpactBubblesProps {
  bubbles: ImpactBubble[];
  onExpire: (id: number) => void;
}

/**
 * One emoji, parked in world space where its letter landed.
 *
 * Split into its own component purely so each bubble owns its own timer.
 * Doing this from the parent would mean juggling a map of timers keyed by
 * id and reconciling it against the array on every render; here, mount and
 * unmount do that bookkeeping for free.
 */
function Bubble({
  bubble,
  onExpire,
}: {
  bubble: ImpactBubble;
  onExpire: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onExpire(bubble.id), BUBBLE_LIFETIME_MS);
    // Without this, a bubble unmounted early (a rebuild clearing the scene,
    // or React 19 StrictMode's double-invoked effect in dev) would still
    // fire its removal later, deleting whatever id got reused after it.
    return () => clearTimeout(timer);
  }, [bubble.id, onExpire]);

  return (
    <Html
      position={[
        bubble.position[0],
        bubble.position[1] + BUBBLE_LIFT,
        bubble.position[2],
      ]}
      center
      // Scales with distance, so a bubble at the back of the room reads as
      // further away instead of being the same size as one up front.
      distanceFactor={6}
      zIndexRange={[20, 0]}
    >
      <div className="impact-bubble">{bubble.emoji}</div>
    </Html>
  );
}

export default function ImpactBubbles({
  bubbles,
  onExpire,
}: ImpactBubblesProps) {
  return (
    <>
      {bubbles.map((bubble) => (
        <Bubble key={bubble.id} bubble={bubble} onExpire={onExpire} />
      ))}
    </>
  );
}
