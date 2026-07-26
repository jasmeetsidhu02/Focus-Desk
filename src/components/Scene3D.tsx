import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { SCENE_OBJECT_IDS, sceneObjects } from "../data/objects";
import DeskObject from "./DeskObject";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setHovered, setSelected } from "../store/sceneSlice";

// Looked up once at module load, not per-render — same reasoning as the
// SCENE_OBJECT_IDS lesson: derive from the single source of truth (the
// data file) instead of re-typing the lamp's position as magic numbers here.
const lampObject = sceneObjects.find(
  (object) => object.id === SCENE_OBJECT_IDS.LAMP,
)!;

const BACKGROUND_LIGHTS_ON = "#2b2032";
const BACKGROUND_LIGHTS_OFF = "#100e14";
const AMBIENT_INTENSITY_ON = 0.35;
const AMBIENT_INTENSITY_OFF = 0.08;
const LAMP_LIGHT_COLOR = "#d8a13a"; // same amber as the lamp mesh itself

function Lamp() {
  const isLightsOn = useAppSelector((state) => state.scene.lightsOn);

  if (!isLightsOn) return null;

  const [x, y, z] = lampObject.position;

  return (
    <pointLight
      position={[x, y + 0.5, z]}
      color={LAMP_LIGHT_COLOR}
      intensity={15}
    />
  );
}

export default function Scene3D() {
  const isLightsOn = useAppSelector((state) => state.scene.lightsOn);
  const dispatch = useAppDispatch();

  const onPointerMissed = () => {
    dispatch(setSelected(null));
    dispatch(setHovered(null));
  };

  return (
    <Canvas onPointerMissed={onPointerMissed}>
      <OrbitControls></OrbitControls>
      <color
        attach="background"
        args={[isLightsOn ? BACKGROUND_LIGHTS_ON : BACKGROUND_LIGHTS_OFF]}
      />
      <ambientLight
        intensity={isLightsOn ? AMBIENT_INTENSITY_ON : AMBIENT_INTENSITY_OFF}
      />
      <Lamp />
      {sceneObjects.map((object) => (
        <DeskObject key={object.id} data={object} />
      ))}
    </Canvas>
  );
}
