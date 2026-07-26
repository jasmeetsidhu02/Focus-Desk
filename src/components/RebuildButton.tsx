import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group, MeshStandardMaterial } from "three";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "./RebuildButton.css";

const RADIUS = 0.09;
const TUBE = 0.014;
// Leaves a gap in the ring for the arrowhead to sit in, so it reads as a
// refresh icon rather than a plain donut.
const ARC = Math.PI * 1.55;

const IDLE_SPIN = 0.6;
const HOVER_SPIN = 3.2;
const FADE_SPEED = 4;

const accentColor = "#b9a6ff";

interface RebuildButtonProps {
  position: [number, number, number];
  visible: boolean;
  onClick: () => void;
}

function setCursor(cursor: string) {
  document.body.style.cursor = cursor;
}

export default function RebuildButton({
  position,
  visible,
  onClick,
}: RebuildButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);

  const spinRef = useRef<Group>(null!);
  const scaleRef = useRef<Group>(null!);
  const ringMaterialRef = useRef<MeshStandardMaterial>(null!);
  const arrowMaterialRef = useRef<MeshStandardMaterial>(null!);

  useFrame((_, delta) => {
    // Fade/scale in and out rather than popping, and keep the object
    // mounted either way — physics-adjacent UI appearing mid-interaction
    // is jarring enough without it snapping into existence.
    const target = visible ? 1 : 0;
    const current = scaleRef.current.scale.x;
    const next = prefersReducedMotion
      ? target
      : current + (target - current) * Math.min(1, delta * FADE_SPEED);

    scaleRef.current.scale.setScalar(next);
    scaleRef.current.visible = next > 0.01;

    const opacity = next;
    ringMaterialRef.current.opacity = opacity;
    arrowMaterialRef.current.opacity = opacity;

    const emissive = hovered ? 1.4 : 0.35;
    ringMaterialRef.current.emissiveIntensity = emissive;
    arrowMaterialRef.current.emissiveIntensity = emissive;

    if (!prefersReducedMotion) {
      spinRef.current.rotation.z -=
        delta * (hovered ? HOVER_SPIN : IDLE_SPIN);
    }
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!visible) return;
    setHovered(true);
    setCursor("pointer");
  };

  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(false);
    setCursor("auto");
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!visible) return;
    setHovered(false);
    setCursor("auto");
    onClick();
  };

  return (
    <group position={position}>
      <group ref={scaleRef}>
        <group
          ref={spinRef}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={handleClick}
        >
          {/* Open ring — the body of the ↻ icon. */}
          <mesh>
            <torusGeometry args={[RADIUS, TUBE, 12, 48, ARC]} />
            <meshStandardMaterial
              ref={ringMaterialRef}
              color={accentColor}
              emissive={accentColor}
              roughness={0.4}
              transparent
              opacity={0}
            />
          </mesh>

          {/* Arrowhead, parked at the open end of the arc. */}
          <mesh
            position={[
              Math.cos(ARC) * RADIUS,
              Math.sin(ARC) * RADIUS,
              0,
            ]}
            rotation={[0, 0, ARC]}
          >
            <coneGeometry args={[TUBE * 2.6, TUBE * 5, 12]} />
            <meshStandardMaterial
              ref={arrowMaterialRef}
              color={accentColor}
              emissive={accentColor}
              roughness={0.4}
              transparent
              opacity={0}
            />
          </mesh>

          {/* An invisible disc widens the hit area — the ring itself is a
              thin tube and is fiddly to actually hit with a cursor. */}
          <mesh visible={false}>
            <circleGeometry args={[RADIUS * 1.5, 16]} />
          </mesh>
        </group>

        {hovered && visible && (
          <Html position={[0, RADIUS * 2.4, 0]} center distanceFactor={6}>
            <div className="rebuild-tooltip">Put it back. Now.</div>
          </Html>
        )}
      </group>
    </group>
  );
}
