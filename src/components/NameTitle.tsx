import { Html, Text3D, useFont } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Quaternion, Vector3 } from "three";
import type { Group, MeshStandardMaterial } from "three";
import type { Font } from "three-stdlib";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import type { FallenLetter } from "../types";
import RebuildButton from "./RebuildButton";
import "./NameTitle.css";

// MgOpen Helvetiker, from the three.js examples — its license (see
// public/fonts/LICENSE.txt) explicitly permits redistribution.
export const FONT_PATH = "/fonts/helvetiker_bold.typeface.json";

useFont.preload(FONT_PATH);

const NAME_TEXT = "JASMEET SIDHU";
const SUBTITLE_TEXT = "FRONTEND DEVELOPER";
const NAME_LETTER_SPACING = 0.02;

// Reverse psychology: forbidding the click is far more likely to provoke it
// than inviting it. Pairs with the rebuild tooltip ("Put it back. Now.") as
// a two-beat joke — the warning, then the mock outrage once it's ignored.
const HINT_TEXT = "Don't you dare touch my name";
// Held back until the entrance has finished and the scene has had a beat to
// settle — arriving with everything else would just be more motion to read.
const HINT_DELAY_MS = 2600;

// Entrance timing, in seconds.
const ENTRANCE_DURATION = 0.8;
const LETTER_STAGGER = 0.05;
const SUBTITLE_DELAY = 0.55;
const RISE_DISTANCE = 0.22;

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const progressAt = (t: number, delay: number) =>
  easeOutCubic(clamp01((t - delay) / ENTRANCE_DURATION));

// Module scope on purpose: touching document.body from inside a component
// body trips the react-hooks/immutability rule, and this genuinely has
// nothing to do with React state.
function setCursor(cursor: string) {
  document.body.style.cursor = cursor;
}

// Reused across clicks instead of allocating per event.
const scratchPosition = new Vector3();
const scratchQuaternion = new Quaternion();

/** Small random spin so letters tumble as they drop instead of dead-falling. */
function randomSpin(): [number, number, number] {
  const spread = 4;
  return [
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
  ];
}

/** A slight outward nudge, so a whole word doesn't collapse into one column. */
function randomNudge(): [number, number, number] {
  return [(Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2];
}

export interface LetterSlot {
  index: number;
  char: string;
  x: number;
}

interface NameLayout {
  slots: LetterSlot[];
  /**
   * Where the name ends, in the title group's local space. Falls out of
   * the same pass that positions the glyphs — anything that wants to sit
   * after the name needs it, and re-measuring separately would be a
   * second copy of the advance maths to keep in sync.
   */
  width: number;
}

/**
 * Lays out one Text3D mesh per character.
 *
 * Rendering the name as a single Text3D would make it a single mesh, so a
 * click couldn't tell which letter was hit. Splitting it means positioning
 * each glyph by hand: the font data carries a horizontal advance (`ha`) per
 * glyph in font units, which scales to world units by `ha / resolution *
 * size` — the same maths Text3D does internally.
 */
function computeLayout(font: Font, text: string, size: number): NameLayout {
  const { glyphs, resolution } = font.data;
  const slots: LetterSlot[] = [];
  let x = 0;

  for (const char of text) {
    const glyph = glyphs[char];
    const advance = glyph ? (glyph.ha / resolution) * size : size * 0.5;

    // Spaces advance the cursor but aren't clickable letters.
    if (char !== " ") {
      slots.push({ index: slots.length, char, x });
    }
    x += advance + NAME_LETTER_SPACING * size;
  }

  // The loop adds letter-spacing after every glyph including the last;
  // that trailing gap isn't part of the name's width.
  return { slots, width: x - NAME_LETTER_SPACING * size };
}

interface NameTitleProps {
  // World-space placement, not screen-anchored: the title sits *in* the
  // scene, so the cursor parallax drifts it along with everything else.
  position: [number, number, number];
  rotation: [number, number, number];
  nameSize: number;
  subtitleSize: number;
  floatAmount: number;
  floatSpeed: number;
  buttonOffset: [number, number, number];
  /**
   * The group the letters live in. Shared with FallenLetters so returning
   * bodies can resolve their slot's *current* world position each frame —
   * this group is still bobbing and drifting while they fly home.
   */
  anchorRef: RefObject<Group | null>;
  /** Ids of letters currently in the physics world rather than in place. */
  fallenIds: number[];
  /** True once the user has knocked any letter over, ever. Retires the hint. */
  hasDiscovered: boolean;
  onLetterFall: (letter: FallenLetter) => void;
  onRebuild: () => void;
}

export default function NameTitle({
  position,
  rotation,
  nameSize,
  subtitleSize,
  floatAmount,
  floatSpeed,
  buttonOffset,
  anchorRef,
  fallenIds,
  hasDiscovered,
  onLetterFall,
  onRebuild,
}: NameTitleProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const font = useFont(FONT_PATH);

  const { slots, width: nameWidth } = useMemo(
    () => computeLayout(font, NAME_TEXT, nameSize),
    [font, nameSize],
  );

  // Only the timing lives here — whether the user has *earned* their way
  // past the hint is tracked at the point the interaction happens, in
  // Scene3D, and arrives as a prop.
  const [hintReady, setHintReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHintReady(true), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const subtitleRef = useRef<Group>(null!);
  const subtitleMaterialRef = useRef<MeshStandardMaterial>(null!);
  const letterRefs = useRef<(Group | null)[]>([]);
  const letterMaterialRefs = useRef<(MeshStandardMaterial | null)[]>([]);

  // Captured on the first frame rather than at module load, so the entrance
  // is timed from when this actually mounts (after the models load).
  const startTime = useRef<number | null>(null);

  useFrame((state) => {
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime;
    }
    const t = state.clock.elapsedTime - startTime.current;

    slots.forEach((slot, i) => {
      const group = letterRefs.current[i];
      const material = letterMaterialRefs.current[i];
      if (!group || !material) return;

      const p = prefersReducedMotion
        ? 1
        : progressAt(t, slot.index * LETTER_STAGGER);

      group.position.y = (1 - p) * -RISE_DISTANCE;
      material.opacity = p;
    });

    const subtitleP = prefersReducedMotion ? 1 : progressAt(t, SUBTITLE_DELAY);
    subtitleRef.current.position.y =
      -nameSize + (1 - subtitleP) * -RISE_DISTANCE;
    subtitleMaterialRef.current.opacity = subtitleP;

    // Idle bob, on its own group so it layers on top of the entrance
    // offsets above instead of the two overwriting each other.
    if (anchorRef.current) {
      anchorRef.current.position.y = prefersReducedMotion
        ? 0
        : Math.sin(t * floatSpeed) * floatAmount;
    }
  });

  const handleLetterClick =
    (slot: LetterSlot) => (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();

      // Snapshot where the letter is *right now* in world space — mid-float,
      // mid-parallax — so the rigid body starts exactly where the rendered
      // letter was and there's no visible jump on handoff.
      event.object.getWorldPosition(scratchPosition);
      event.object.getWorldQuaternion(scratchQuaternion);

      onLetterFall({
        id: slot.index,
        char: slot.char,
        size: nameSize,
        slotX: slot.x,
        position: [scratchPosition.x, scratchPosition.y, scratchPosition.z],
        quaternion: [
          scratchQuaternion.x,
          scratchQuaternion.y,
          scratchQuaternion.z,
          scratchQuaternion.w,
        ],
        // Rolled once, here, and then kept — see the note on the type.
        linearVelocity: randomNudge(),
        angularVelocity: randomSpin(),
      });
    };

  return (
    <group position={position} rotation={rotation}>
      <group ref={anchorRef}>
        {slots.map((slot, i) => {
          // A fallen letter simply isn't rendered here — the physics body
          // in FallenLetters is the only copy of it, and its slot is left
          // empty until it flies home.
          if (fallenIds.includes(slot.index)) return null;

          return (
            <group
              key={slot.index}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              position-x={slot.x}
            >
              <Text3D
                font={FONT_PATH}
                size={nameSize}
                height={0.06}
                curveSegments={6}
                bevelEnabled
                bevelThickness={0.008}
                bevelSize={0.006}
                bevelSegments={3}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  setCursor("pointer");
                }}
                onPointerOut={(event) => {
                  event.stopPropagation();
                  setCursor("auto");
                }}
                onClick={handleLetterClick(slot)}
              >
                {slot.char}
                <meshStandardMaterial
                  ref={(el) => {
                    letterMaterialRefs.current[i] = el;
                  }}
                  color="#f4f2f6"
                  roughness={0.35}
                  metalness={0.1}
                  transparent
                  opacity={0}
                />
              </Text3D>
            </group>
          );
        })}

        {/* Parked after the last letter rather than before the first, so
            it reads as the end of the name rather than a bullet in front
            of it. `buttonOffset` is now the gap from the name's end, not
            an absolute position — which means it stays put when the name
            or nameSize changes instead of needing re-tuning. */}
        <RebuildButton
          position={[
            nameWidth + buttonOffset[0],
            buttonOffset[1],
            buttonOffset[2],
          ]}
          visible={fallenIds.length > 0}
          onClick={onRebuild}
        />

        {hintReady && !hasDiscovered && (
          <Html
            position={[0.02, -nameSize - subtitleSize * 2.4, 0]}
            distanceFactor={6}
            zIndexRange={[10, 0]}
          >
            <div className="name-hint">{HINT_TEXT}</div>
          </Html>
        )}

        <group ref={subtitleRef} position-x={0.02}>
          <Text3D
            font={FONT_PATH}
            size={subtitleSize}
            height={0.02}
            curveSegments={4}
            letterSpacing={0.06}
          >
            {SUBTITLE_TEXT}
            <meshStandardMaterial
              ref={subtitleMaterialRef}
              color="#8f8a97"
              roughness={0.6}
              metalness={0}
              transparent
              opacity={0}
            />
          </Text3D>
        </group>
      </group>
    </group>
  );
}
