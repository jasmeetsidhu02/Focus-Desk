import { useFrame, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";

interface CameraParallaxProps {
  // The camera's resting position — the parallax offsets from here rather
  // than accumulating, so this can be changed live (by the debug panel)
  // without the camera drifting.
  basePosition: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  // How far (in scene units) the camera shifts at the edges of the canvas.
  strength: number;
  // How quickly the camera eases toward its target each frame — smaller is
  // smoother/slower, closer to 1 is snappier.
  damping: number;
}

export default function CameraParallax({
  basePosition,
  lookAt,
  fov,
  strength,
  damping,
}: CameraParallaxProps) {
  const { camera, pointer } = useThree();

  // Mutating `camera` directly inside useFrame is the standard R3F
  // pattern for per-frame updates (avoids a React re-render every
  // frame) — the lint rule disabled below is generic React-Compiler
  // guidance that isn't aware of that exception. It flags both the
  // individual mutating lines and the useFrame(...) call itself (since
  // the callback closes over `camera`), so the disable has to wrap the
  // whole call, not just the lines inside it.
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    const targetX = basePosition[0] + pointer.x * strength;

    // Lerp toward the target each frame instead of snapping straight to
    // it — this is what makes the movement feel like an eased drift
    // rather than the camera rigidly tracking the cursor. y/z ease too,
    // so dragging the debug sliders glides instead of jumping.
    camera.position.x += (targetX - camera.position.x) * damping;
    camera.position.y += (basePosition[1] - camera.position.y) * damping;
    camera.position.z += (basePosition[2] - camera.position.z) * damping;
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);

    const perspective = camera as PerspectiveCamera;
    if (perspective.fov !== fov) {
      perspective.fov = fov;
      // Projection matrix is derived from fov/aspect/near/far and is only
      // recomputed on demand, so changing fov alone has no visible effect
      // until this is called.
      perspective.updateProjectionMatrix();
    }
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
