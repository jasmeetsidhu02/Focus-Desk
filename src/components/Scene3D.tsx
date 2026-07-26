import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useCallback, useRef, useState } from "react";
import type { Group } from "three";
import { ASSET_PATHS } from "../data/assets";
import { useSceneControls } from "../hooks/useSceneControls";
import type { FallenLetter } from "../types";
import CameraParallax from "./CameraParallax";
import FallenLetters from "./FallenLetters";
import NameTitle from "./NameTitle";
import OfficeModel from "./OfficeModel";
import { useAppSelector } from "../store/hooks";

// How much the lights dim when `lightsOn` is false. The lit values
// themselves come from the debug panel, so this stays a plain multiplier
// rather than a second full set of constants to keep in sync.
const LIGHTS_OFF_FACTOR = 0.1;

const DARK_MODEL_PATHS = [
  ASSET_PATHS.DARK_FIRST,
  ASSET_PATHS.DARK_SECOND,
  ASSET_PATHS.DARK_THIRD,
  ASSET_PATHS.DARK_FOURTH,
];

export default function Scene3D() {
  const isLightsOn = useAppSelector((state) => state.scene.lightsOn);
  const { camera, parallax, lights, title, physics } = useSceneControls();

  const [fallenLetters, setFallenLetters] = useState<FallenLetter[]>([]);
  const [isReturning, setIsReturning] = useState(false);
  // Sticky: survives a rebuild emptying `fallenLetters`, so the "go on,
  // knock my name over" hint never comes back once it's been acted on.
  const [hasDiscovered, setHasDiscovered] = useState(false);

  // Shared between the title and the physics bodies: the letters' slots are
  // defined in this group's local space, and it keeps moving (idle float,
  // cursor parallax) while the letters are flying back to them.
  const titleAnchorRef = useRef<Group | null>(null);

  const handleLetterFall = useCallback((letter: FallenLetter) => {
    setHasDiscovered(true);
    setFallenLetters((current) =>
      // Guard against a double-click racing the re-render: without this a
      // second click on the same letter would add a duplicate body.
      current.some((existing) => existing.id === letter.id)
        ? current
        : [...current, letter],
    );
  }, []);

  const handleRebuild = useCallback(() => setIsReturning(true), []);

  // Once the bodies have flown home, drop them — the title re-renders its
  // own letters back into those slots, already at full opacity since the
  // entrance animation finished long ago.
  const handleReturnComplete = useCallback(() => {
    setFallenLetters([]);
    setIsReturning(false);
  }, []);

  const lightFactor = isLightsOn ? 1 : LIGHTS_OFF_FACTOR;

  return (
    <>
      <Canvas camera={{ position: camera.position, fov: camera.fov }}>
        <CameraParallax
          basePosition={camera.position}
          lookAt={camera.lookAt}
          fov={camera.fov}
          strength={parallax.strength}
          damping={parallax.damping}
        />
        <color attach="background" args={[lights.background]} />
        <hemisphereLight
          color={lights.hemiSky}
          groundColor={lights.hemiGround}
          intensity={lights.hemiIntensity * lightFactor}
        />
        <directionalLight
          position={lights.sunPosition}
          intensity={lights.sunIntensity * lightFactor}
        />
        <Suspense fallback={null}>
          {DARK_MODEL_PATHS.map((path) => (
            <OfficeModel key={path} path={path} position={[0, 0, 0]} />
          ))}

          <NameTitle
            position={title.position}
            rotation={title.rotation}
            nameSize={title.nameSize}
            subtitleSize={title.subtitleSize}
            floatAmount={title.floatAmount}
            floatSpeed={title.floatSpeed}
            buttonOffset={title.buttonOffset}
            anchorRef={titleAnchorRef}
            fallenIds={fallenLetters.map((letter) => letter.id)}
            hasDiscovered={hasDiscovered}
            onLetterFall={handleLetterFall}
            onRebuild={handleRebuild}
          />

          <Physics
            gravity={[0, physics.gravity, 0]}
            debug={physics.debug}
            // These letters are small (~0.3 units) and thin, which is the
            // regime where the default 4 solver iterations leave visible
            // contact jitter. More iterations resolve resting contacts
            // harder, at a cost that's irrelevant for a dozen bodies.
            numSolverIterations={12}
          >
            {/* Invisible ground for the letters to land on. The room's own
                floor is baked into one big mesh with the walls, so giving
                that a collider would be far more geometry than this needs. */}
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider
                args={[50, 0.1, 50]}
                position={[0, physics.floorY - 0.1, 0]}
              />
            </RigidBody>

            <FallenLetters
              letters={fallenLetters}
              isReturning={isReturning}
              anchorRef={titleAnchorRef}
              onReturnComplete={handleReturnComplete}
            />
          </Physics>
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
