import { useControls } from "leva";

type Vec3 = [number, number, number];

const toTuple = (v: { x: number; y: number; z: number }): Vec3 => [
  v.x,
  v.y,
  v.z,
];

/**
 * Live-tunable scene values, backed by the leva debug panel.
 *
 * The defaults here are the source of truth for how the scene looks — the
 * panel just lets you drag them around at runtime. Once a value feels
 * right, copy it back into the default so it survives a reload.
 *
 * Called from Scene3D (a DOM-side component) rather than from inside
 * <Canvas>, so the values flow down to the 3D components as ordinary
 * props and those components stay free of debug concerns.
 */
export function useSceneControls() {
  const camera = useControls("Camera", {
    position: { value: { x: -4, y: 3, z: 6 }, step: 0.1 },
    lookAt: { value: { x: -2, y: 0.5, z: 0 }, step: 0.1 },
    fov: { value: 45, min: 10, max: 120, step: 1 },
  });

  const parallax = useControls("Parallax", {
    strength: { value: 2, min: 0, max: 10, step: 0.1 },
    damping: { value: 0.05, min: 0.005, max: 0.5, step: 0.005 },
  });

  // Keeps the framing usable on narrow windows and phones. Drag the
  // browser window narrow to see these work without a device — the
  // pullback is driven by aspect ratio, not by a media query.
  const responsive = useControls("Responsive", {
    // The window shape everything above was tuned at. Anything narrower
    // pulls the camera back; anything wider is left alone.
    designAspect: { value: 1.6, min: 0.5, max: 3, step: 0.05 },
    // Ceiling on that retreat. A portrait phone would otherwise ask for
    // ~3.5x and end up viewing the room from across the street.
    maxPullback: { value: 2.6, min: 1, max: 4, step: 0.05 },
    // Slides the whole shot sideways as the window narrows. Negative pans
    // left, toward the name — which sits entirely left of the point the
    // camera aims at, and so is the first thing to fall out of frame.
    // Drag this while the browser is narrow to find the balance between
    // showing all of the name and keeping the room in shot.
    aimShiftX: { value: -1.1, min: -4, max: 4, step: 0.05 },
  });

  const lights = useControls("Lights", {
    background: "rgb(16, 15, 16)",
    hemiIntensity: { value: 1.1, min: 0, max: 5, step: 0.05 },
    hemiSky: "#fff1d6",
    hemiGround: "#140f1a",
    sunIntensity: { value: 2.4, min: 0, max: 10, step: 0.1 },
    sunPosition: { value: { x: 5, y: 8, z: 5 }, step: 0.5 },
  });

  const title = useControls("Title", {
    position: { value: { x: -6, y: 1, z: 0 }, step: 0.05 },
    rotation: { value: { x: 0, y: 0.35, z: 0 }, step: 0.05 },
    nameSize: { value: 0.34, min: 0.05, max: 2, step: 0.01 },
    subtitleSize: { value: 0.13, min: 0.02, max: 1, step: 0.01 },
    floatAmount: { value: 0.025, min: 0, max: 0.3, step: 0.005 },
    floatSpeed: { value: 0.7, min: 0, max: 4, step: 0.05 },
    // Where the ↻ rebuild button sits, measured from the *end* of the
    // name rather than the title's origin — so it stays glued to the last
    // letter however long the name is or how nameSize changes.
    // x is the gap after that letter; y is roughly half a cap height, to
    // centre it against the letters rather than the baseline.
    buttonOffset: { value: { x: 0.0, y: 0.88, z: 0 }, step: 0.02 },
  });

  const physics = useControls("Physics", {
    gravity: { value: -9.81, min: -30, max: 0, step: 0.1 },
    // Height of the invisible collider the letters land on. Should sit at
    // the room's floor level — nudge until letters rest on the rug rather
    // than sinking through it or hovering above it.
    floorY: { value: 0, min: -3, max: 3, step: 0.01 },
    // Draws Rapier's collider wireframes — useful for checking the letter
    // hulls and where the floor plane actually is.
    debug: false,
  });

  return {
    camera: {
      position: toTuple(camera.position),
      lookAt: toTuple(camera.lookAt),
      fov: camera.fov,
    },
    parallax,
    responsive,
    lights: {
      ...lights,
      sunPosition: toTuple(lights.sunPosition),
    },
    title: {
      ...title,
      position: toTuple(title.position),
      rotation: toTuple(title.rotation),
      buttonOffset: toTuple(title.buttonOffset),
    },
    physics,
  };
}
