import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";
import { Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

// How fast trauma bleeds off, in units per second. 1 / this ≈ the length of
// the longest possible shake (about 0.6s from a full-strength hit).
const TRAUMA_DECAY = 1.7;

// Peak positional offset, in scene units, at full trauma.
const SHAKE_POSITION = 0.16;
// Peak camera roll, in radians. A little rotation sells an impact far more
// than translation alone — but too much reads as a broken camera.
const SHAKE_ROLL = 0.035;

// Deliberately unrelated frequencies (and unrelated to each other) so the
// axes never line up into a clean circle or diagonal — that's the
// difference between "shaken" and "orbiting".
const FREQ_X = 43;
const FREQ_Y = 57;
const FREQ_ROLL = 31;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

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
  /**
   * A second, separately-framed shot for tall windows — aimed at the name
   * rather than the room.
   *
   * Retreating and panning the landscape shot was the previous approach
   * and it can't work: the composition is a ~10-unit-wide horizontal band
   * (name beside room) and a portrait frame is ~7 units wide and very
   * tall. No amount of scaling or sliding makes a landscape arrangement
   * sit well in a portrait frame — it needs its own framing, which is
   * what this is.
   */
  portraitPosition: [number, number, number];
  portraitLookAt: [number, number, number];
  portraitFov: number;
  /** At or above this aspect, the landscape shot is used unchanged. */
  designAspect: number;
  /** At or below this aspect, the portrait shot is used unchanged. */
  portraitAspect: number;
  /**
   * Shared 0–1 "trauma" value. Impacts add to it; this component is the
   * only thing that subtracts from it.
   *
   * A ref rather than store state on purpose: it's read and written every
   * single frame, and routing that through Redux would re-render the whole
   * subscribed tree 60 times a second to animate something React never
   * needs to know about. The ref is a mutable side-channel between the
   * component that causes the shake and the one that performs it.
   */
  traumaRef: RefObject<number>;
}

export default function CameraParallax({
  basePosition,
  lookAt,
  fov,
  strength,
  damping,
  portraitPosition,
  portraitLookAt,
  portraitFov,
  designAspect,
  portraitAspect,
  traumaRef,
}: CameraParallaxProps) {
  const { camera, pointer } = useThree();
  const prefersReducedMotion = usePrefersReducedMotion();

  /**
   * The eased, un-shaken camera position.
   *
   * Kept separately from `camera.position` because the shake writes into
   * that too. Lerping the camera's own position toward the target would
   * mean each frame's easing started from the *previous frame's shake
   * offset* — the smoothing would fight the shake and drag the camera
   * around after every impact.
   */
  const eased = useRef<Vector3 | null>(null);

  /**
   * The aim point and fov get the same treatment, because a route change
   * moves all three at once. Snapping either one while the position eased
   * would read as the camera swinging round and *then* travelling, rather
   * than one continuous move to the new station.
   */
  const easedLookAt = useRef<Vector3 | null>(null);
  const easedFov = useRef<number | null>(null);

  // Mutating `camera` directly inside useFrame is the standard R3F
  // pattern for per-frame updates (avoids a React re-render every
  // frame) — the lint rule disabled below is generic React-Compiler
  // guidance that isn't aware of that exception. It flags both the
  // individual mutating lines and the useFrame(...) call itself (since
  // the callback closes over `camera`), so the disable has to wrap the
  // whole call, not just the lines inside it.
  /* eslint-disable react-hooks/immutability */
  useFrame((state, delta) => {
    // Seeded on the first frame rather than at construction, so it starts
    // wherever the camera actually is instead of snapping in from a stale
    // prop value.
    if (eased.current === null) {
      eased.current = new Vector3().copy(camera.position);
    }
    if (easedLookAt.current === null) {
      easedLookAt.current = new Vector3(lookAt[0], lookAt[1], lookAt[2]);
    }
    if (easedFov.current === null) {
      easedFov.current = fov;
    }
    const base = eased.current;
    const aim = easedLookAt.current;
    const perspective = camera as PerspectiveCamera;

    // `damping` is a fraction-per-frame, so using it raw would make the
    // easing twice as fast on a 120Hz display as on a 60Hz one — and a
    // route transition that changes length with the monitor is a bug you
    // only notice on someone else's machine. This converts it to a
    // fraction-per-second normalised against 60fps.
    const t = 1 - Math.pow(1 - damping, delta * 60);

    /**
     * 0 on a landscape window, 1 on a portrait one, sliding between them
     * across the middle.
     *
     * Blending two authored shots rather than deriving one from the other
     * is the whole idea: each is framed for its own window shape, and
     * anything in between gets a sensible mix for free. Resizing a
     * desktop window narrow walks through the transition continuously —
     * there's no breakpoint to jump at.
     */
    const blend = clamp(
      (designAspect - perspective.aspect) / (designAspect - portraitAspect),
      0,
      1,
    );
    const mix = (landscape: number, portrait: number) =>
      landscape + (portrait - landscape) * blend;

    // Faded out as the shot goes portrait: there's no hovering pointer on
    // a touch screen, so the parallax has nothing meaningful to track and
    // only adds drift when the frame is already tight.
    const parallaxX = pointer.x * strength * (1 - blend);

    // Lerp toward the target each frame instead of snapping straight to
    // it — this is what makes the movement feel like an eased drift
    // rather than the camera rigidly tracking the cursor. It doubles as
    // both the route transition and the resize transition: nothing
    // animates the camera explicitly, the target moves and this chases it.
    base.x +=
      (mix(basePosition[0], portraitPosition[0]) + parallaxX - base.x) * t;
    base.y += (mix(basePosition[1], portraitPosition[1]) - base.y) * t;
    base.z += (mix(basePosition[2], portraitPosition[2]) - base.z) * t;

    aim.x += (mix(lookAt[0], portraitLookAt[0]) - aim.x) * t;
    aim.y += (mix(lookAt[1], portraitLookAt[1]) - aim.y) * t;
    aim.z += (mix(lookAt[2], portraitLookAt[2]) - aim.z) * t;

    camera.position.copy(base);
    camera.lookAt(aim.x, aim.y, aim.z);

    // Decay first, then apply — so trauma added this frame still shakes on
    // this frame, and a stale value can never linger once impacts stop.
    traumaRef.current = Math.max(0, traumaRef.current - delta * TRAUMA_DECAY);

    // Squaring makes the falloff non-linear: a hard hit is dramatically
    // punchier than a soft one, and the tail end fades to nothing quickly
    // instead of buzzing at a low level for ages.
    const shake = traumaRef.current * traumaRef.current;

    if (shake > 0.0001 && !prefersReducedMotion) {
      const t = state.clock.elapsedTime;

      // Applied *after* lookAt: offsetting before it would just re-aim the
      // camera at the same target and quietly cancel most of the shake out.
      camera.position.x += Math.sin(t * FREQ_X) * shake * SHAKE_POSITION;
      camera.position.y += Math.sin(t * FREQ_Y + 1.7) * shake * SHAKE_POSITION;
      camera.rotation.z += Math.sin(t * FREQ_ROLL + 0.9) * shake * SHAKE_ROLL;
    }

    easedFov.current += (mix(fov, portraitFov) - easedFov.current) * t;

    // Skip the last hundredth of a degree: the lerp is asymptotic and
    // would otherwise rebuild the projection matrix forever chasing a
    // difference nobody can see.
    if (Math.abs(perspective.fov - easedFov.current) > 0.01) {
      perspective.fov = easedFov.current;
      // Projection matrix is derived from fov/aspect/near/far and is only
      // recomputed on demand, so changing fov alone has no visible effect
      // until this is called.
      perspective.updateProjectionMatrix();
    }
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
