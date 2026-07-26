import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import type { RefObject } from "react";
import { Quaternion, Vector3 } from "three";
import type { Group } from "three";
import type { FallenLetter } from "../types";
import { FONT_PATH } from "./NameTitle";

// How long a letter takes to fly back to its slot, in seconds.
const RETURN_DURATION = 0.9;
// Height of the arc it travels through on the way, so letters lift and
// swoop home rather than sliding along the floor.
const RETURN_ARC = 0.55;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// Ease in *and* out — the letter peels off the floor gently and settles
// into its slot gently, rather than starting or stopping abruptly.
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

// Scratch objects, reused every frame rather than allocated per letter.
const scratchTarget = new Vector3();
const scratchPosition = new Vector3();
const scratchQuaternion = new Quaternion();
const scratchTargetQuaternion = new Quaternion();

interface StartTransform {
  position: Vector3;
  quaternion: Quaternion;
}

interface FallenLettersProps {
  letters: FallenLetter[];
  isReturning: boolean;
  /** The title's float group — the letters' slots live in its local space. */
  anchorRef: RefObject<Group | null>;
  onReturnComplete: () => void;
}

export default function FallenLetters({
  letters,
  isReturning,
  anchorRef,
  onReturnComplete,
}: FallenLettersProps) {
  const bodies = useRef(new Map<number, RapierRigidBody>());
  const startTransforms = useRef<Map<number, StartTransform> | null>(null);
  const elapsed = useRef(0);
  const hasCompleted = useRef(false);

  useFrame((_, delta) => {
    if (!isReturning) {
      // Reset so the next rebuild starts a fresh flight.
      startTransforms.current = null;
      elapsed.current = 0;
      hasCompleted.current = false;
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor || hasCompleted.current) return;

    // Capture where each letter was lying when the rebuild was triggered.
    // Read from the physics body rather than the React state, because the
    // simulation has been moving it since it fell.
    if (startTransforms.current === null) {
      startTransforms.current = new Map();
      letters.forEach((letter) => {
        const body = bodies.current.get(letter.id);
        if (!body) return;
        const t = body.translation();
        const r = body.rotation();
        startTransforms.current!.set(letter.id, {
          position: new Vector3(t.x, t.y, t.z),
          quaternion: new Quaternion(r.x, r.y, r.z, r.w),
        });
      });
    }

    elapsed.current += delta;
    const p = clamp01(elapsed.current / RETURN_DURATION);
    const eased = easeInOutCubic(p);

    // The title is still bobbing and drifting with the cursor, so the slot
    // being aimed at moves every frame. Force the world matrix up to date
    // before converting, otherwise this reads last frame's position.
    anchor.updateWorldMatrix(true, false);
    anchor.getWorldQuaternion(scratchTargetQuaternion);

    letters.forEach((letter) => {
      const body = bodies.current.get(letter.id);
      const start = startTransforms.current?.get(letter.id);
      if (!body || !start) return;

      scratchTarget.set(letter.slotX, 0, 0);
      anchor.localToWorld(scratchTarget);

      scratchPosition.copy(start.position).lerp(scratchTarget, eased);
      // Lift through the middle of the flight, peaking at the halfway
      // point and returning to zero on arrival.
      scratchPosition.y += Math.sin(p * Math.PI) * RETURN_ARC;

      scratchQuaternion
        .copy(start.quaternion)
        .slerp(scratchTargetQuaternion, eased);

      body.setNextKinematicTranslation(scratchPosition);
      body.setNextKinematicRotation(scratchQuaternion);
    });

    if (p >= 1) {
      // Guard against firing on every frame until the state update lands.
      hasCompleted.current = true;
      onReturnComplete();
    }
  });

  return (
    <>
      {letters.map((letter) => (
        <RigidBody
          // Keyed by id so React never reuses one letter's body for another
          // — a reused body would keep the previous letter's velocity and
          // position, making the new one appear mid-flight.
          key={letter.id}
          ref={(body) => {
            if (body) bodies.current.set(letter.id, body);
            else bodies.current.delete(letter.id);
          }}
          // Kinematic while returning: gravity and collisions stop applying,
          // so the flight path is driven entirely by the frame loop above
          // instead of fighting the simulation.
          type={isReturning ? "kinematicPosition" : "dynamic"}
          position={letter.position}
          quaternion={letter.quaternion}
          // "hull" wraps the glyph in a convex hull: cheap, and close enough
          // for letters. A trimesh would capture the holes in A/D/O exactly
          // but is far more expensive and unstable for small dynamic bodies.
          colliders="hull"
          // Stable across renders (rolled once at fall time) — regenerating
          // these per render re-applies velocity to resting bodies, which
          // is exactly what makes a settled pile shiver.
          linearVelocity={letter.linearVelocity}
          angularVelocity={letter.angularVelocity}
          // No bounce: letters are small and thin, and even a little
          // restitution keeps them micro-hopping instead of settling.
          restitution={0}
          friction={1.2}
          // Damping bleeds off the residual energy that would otherwise
          // keep a body just above Rapier's sleep threshold forever.
          linearDamping={0.6}
          angularDamping={0.9}
          // Once asleep, a body stops being simulated entirely — which is
          // both the cure for jitter and a nice perf win.
          canSleep
        >
          <Text3D
            font={FONT_PATH}
            size={letter.size}
            height={0.06}
            curveSegments={6}
            bevelEnabled
            bevelThickness={0.008}
            bevelSize={0.006}
            bevelSegments={3}
          >
            {letter.char}
            <meshStandardMaterial
              color="#f4f2f6"
              roughness={0.35}
              metalness={0.1}
            />
          </Text3D>
        </RigidBody>
      ))}
    </>
  );
}
