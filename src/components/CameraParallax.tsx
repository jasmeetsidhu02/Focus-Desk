import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

// Fixed point the camera always looks at — the room's rough center.
const LOOK_AT_TARGET = new Vector3(0, 1, 0);
// How far (in scene units) the camera shifts at pointer.x = ±1 (the edges
// of the canvas). Tune by eye.
const PARALLAX_STRENGTH = 2;
// How quickly the camera eases toward its target position each frame —
// smaller = smoother/slower, closer to 1 = snappier/more immediate.
const DAMPING = 0.05;

export default function CameraParallax() {
  const { camera, pointer } = useThree();
  // The camera's starting position, captured once on first frame rather
  // than hardcoded — so this works whatever position/fov <Canvas> is
  // actually given, without this component needing to know that value.
  const basePosition = useRef<Vector3 | null>(null);

  // Mutating `camera` directly inside useFrame is the standard R3F
  // pattern for per-frame updates (avoids a React re-render every
  // frame) — the lint rule disabled below is generic React-Compiler
  // guidance that isn't aware of that exception. It flags both the
  // individual mutating lines and the useFrame(...) call itself (since
  // the callback closes over `camera`), so the disable has to wrap the
  // whole call, not just the lines inside it.
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    if (!basePosition.current) {
      basePosition.current = camera.position.clone();
    }

    const targetX = basePosition.current.x + pointer.x * PARALLAX_STRENGTH;
    // Lerp toward the target each frame instead of snapping straight to
    // it — this is what makes the movement feel like an eased drift
    // rather than the camera rigidly tracking the cursor.
    camera.position.x += (targetX - camera.position.x) * DAMPING;
    camera.lookAt(LOOK_AT_TARGET);
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
