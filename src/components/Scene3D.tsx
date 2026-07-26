import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useCallback, useRef, useState } from "react";
import type { Group } from "three";
import { ASSET_PATHS } from "../data/assets";
import { moodFor } from "../data/moods";
import { useSceneControls } from "../hooks/useSceneControls";
import type { FallenLetter, ImpactBubble } from "../types";
import CameraParallax from "./CameraParallax";
import FallenLetters from "./FallenLetters";
import ImpactBubbles from "./ImpactBubbles";
import NameTitle from "./NameTitle";
import OfficeModel from "./OfficeModel";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { calmMood, registerImpact } from "../store/sceneSlice";

// How much the lights dim when `lightsOn` is false. The lit values
// themselves come from the debug panel, so this stays a plain multiplier
// rather than a second full set of constants to keep in sync.
const LIGHTS_OFF_FACTOR = 0.1;

// Trauma added by a landing at full force, before the mood multiplier.
// Under 1 on purpose: a single letter shouldn't max out the camera, but a
// flurry of them stacking up should.
const TRAUMA_PER_IMPACT = 0.5;

// The lighter jolt of the letter being knocked loose, felt on the click
// itself rather than a beat later when it hits the floor.
//
// This is what guarantees *every* letter shakes the camera: a landing has
// to clear a speed threshold to count, and a letter that only tips a few
// centimetres onto the pile never will. The knock always fires.
const TRAUMA_PER_KNOCK = 0.24;

// The impact speed treated as "as hard as it gets" when scaling trauma.
// Roughly what a letter reaches falling from title height.
const REFERENCE_IMPACT_SPEED = 5;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const pickReaction = (reactions: string[]) =>
  reactions[Math.floor(Math.random() * reactions.length)];

const DARK_MODEL_PATHS = [
  ASSET_PATHS.DARK_FIRST,
  ASSET_PATHS.DARK_SECOND,
  ASSET_PATHS.DARK_THIRD,
  ASSET_PATHS.DARK_FOURTH,
];

export default function Scene3D() {
  const isLightsOn = useAppSelector((state) => state.scene.lightsOn);
  const moodImpacts = useAppSelector((state) => state.scene.moodImpacts);
  const dispatch = useAppDispatch();
  const { camera, parallax, lights, title, physics } = useSceneControls();

  const [fallenLetters, setFallenLetters] = useState<FallenLetter[]>([]);
  const [isReturning, setIsReturning] = useState(false);
  const [bubbles, setBubbles] = useState<ImpactBubble[]>([]);

  // Never read during render, only incremented to hand out unique keys —
  // which is exactly the job a ref is for. useState here would trigger a
  // pointless extra render on every impact.
  const nextBubbleId = useRef(0);

  // The camera-shake channel. Written here on impact, drained frame by
  // frame inside CameraParallax. Lives as a ref rather than state because
  // nothing about it should cause React to re-render — see the prop's doc
  // comment in CameraParallax for the full reasoning.
  const traumaRef = useRef(0);
  // Sticky: survives a rebuild emptying `fallenLetters`, so the "go on,
  // knock my name over" hint never comes back once it's been acted on.
  const [hasDiscovered, setHasDiscovered] = useState(false);

  // Shared between the title and the physics bodies: the letters' slots are
  // defined in this group's local space, and it keeps moving (idle float,
  // cursor parallax) while the letters are flying back to them.
  const titleAnchorRef = useRef<Group | null>(null);

  /**
   * Feed the camera shake.
   *
   * Accumulates and clamps: knocking three letters over at once shakes
   * harder than three separate drops, but never past full strength.
   * Nothing subtracts here — CameraParallax owns the decay.
   */
  const addTrauma = useCallback((amount: number) => {
    traumaRef.current = Math.min(1, traumaRef.current + amount);
  }, []);

  const handleLetterFall = useCallback(
    (letter: FallenLetter) => {
      setHasDiscovered(true);

      // Deliberately outside the state updater below. Updaters have to stay
      // pure — React can call them twice in StrictMode, and it re-runs them
      // on a re-render, so a shake fired from in there would double up.
      addTrauma(TRAUMA_PER_KNOCK * moodFor(moodImpacts).shake);

      setFallenLetters((current) =>
        // Guard against a double-click racing the re-render: without this a
        // second click on the same letter would add a duplicate body.
        current.some((existing) => existing.id === letter.id)
          ? current
          : [...current, letter],
      );
    },
    [addTrauma, moodImpacts],
  );

  const handleRebuild = useCallback(() => setIsReturning(true), []);

  /**
   * A letter has landed. Three reactions fan out from one event:
   * a shake (ref, per-frame), a bubble (local state, ephemeral), and the
   * mood counter (Redux, app-wide) — each routed to the layer that matches
   * how often it changes and who needs to read it.
   *
   * The second half of a two-beat shake: the knock above is the strike,
   * this is the thump, and how far apart they land is however long the
   * letter spent falling.
   */
  const handleImpact = useCallback(
    (
      letter: FallenLetter,
      position: [number, number, number],
      speed: number,
    ) => {
      const mood = moodFor(moodImpacts);

      // Scaled by how hard it hit *and* by how annoyed the scene already is,
      // so a long drop lands heavier than a short tip onto the pile.
      addTrauma(
        clamp01(speed / REFERENCE_IMPACT_SPEED) * mood.shake * TRAUMA_PER_IMPACT,
      );

      // Random is fine here — an event handler is not render, so this can't
      // produce a different result on a re-render the way an inline
      // Math.random() in JSX would.
      const emoji = pickReaction(mood.reactions);
      const id = nextBubbleId.current++;
      setBubbles((current) => [...current, { id, emoji, position }]);

      dispatch(registerImpact());
      // `letter` isn't needed yet — kept in the signature because the
      // handler is the natural place to react per-character later.
      void letter;
    },
    [addTrauma, dispatch, moodImpacts],
  );

  const handleBubbleExpire = useCallback((id: number) => {
    setBubbles((current) => current.filter((bubble) => bubble.id !== id));
  }, []);

  // Once the bodies have flown home, drop them — the title re-renders its
  // own letters back into those slots, already at full opacity since the
  // entrance animation finished long ago.
  const handleReturnComplete = useCallback(() => {
    setFallenLetters([]);
    setIsReturning(false);
    // Putting it back earns some goodwill, but not all of it — the mood
    // ratchets up faster than it comes down, so a second spree escalates
    // from where the first one left off.
    dispatch(calmMood());
  }, [dispatch]);

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
          traumaRef={traumaRef}
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
              onImpact={handleImpact}
            />
          </Physics>

          {/* Outside <Physics> deliberately: bubbles are positioned in
              world space and take no part in the simulation, so there's
              nothing for them to gain from living inside it. */}
          <ImpactBubbles bubbles={bubbles} onExpire={handleBubbleExpire} />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
