import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ASSET_PATHS } from "../data/assets";
import CameraParallax from "./CameraParallax";
import OfficeModel from "./OfficeModel";
import { useAppSelector } from "../store/hooks";

// OrbitControls let the user find a good view by dragging; without it,
// <Canvas> needs an explicit starting camera position/angle instead of
// relying on the implicit default (which is just [0, 0, 5] — far too
// close for a ~34-unit room). Needs eyeballing/adjusting once rendered.
const CAMERA_POSITION: [number, number, number] = [-3, 3, 6];
const CAMERA_FOV = 45;

const BACKGROUND_LIGHTS_ON = "rgb(16, 15, 16)";
const BACKGROUND_LIGHTS_OFF = "#100e14";

// Hemisphere light = a sky color blended toward a ground color, better
// as a room's base fill than a single flat ambientLight since it adds
// natural top/bottom color variation instead of lighting every surface
// identically regardless of orientation.
const HEMI_SKY_COLOR = "#fff1d6";
const HEMI_GROUND_COLOR = "#140f1a";
const HEMI_INTENSITY_ON = 1.1;
const HEMI_INTENSITY_OFF = 0.15;

// A directional light is what actually gives PBR materials shape —
// hemisphere/ambient alone has no direction, so surfaces read flat with
// no shading contrast. This stands in for a window/room light.
const SUN_INTENSITY_ON = 2.4;
const SUN_INTENSITY_OFF = 0.2;

const DARK_MODEL_PATHS = [
  ASSET_PATHS.DARK_FIRST,
  ASSET_PATHS.DARK_SECOND,
  ASSET_PATHS.DARK_THIRD,
  ASSET_PATHS.DARK_FOURTH,
];

export default function Scene3D() {
  const isLightsOn = useAppSelector((state) => state.scene.lightsOn);

  return (
    <>
      <Canvas camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}>
        <CameraParallax />
        <color
          attach="background"
          args={[isLightsOn ? BACKGROUND_LIGHTS_ON : BACKGROUND_LIGHTS_OFF]}
        />
        <hemisphereLight
          color={HEMI_SKY_COLOR}
          groundColor={HEMI_GROUND_COLOR}
          intensity={isLightsOn ? HEMI_INTENSITY_ON : HEMI_INTENSITY_OFF}
        />
        <directionalLight
          position={[5, 8, 5]}
          intensity={isLightsOn ? SUN_INTENSITY_ON : SUN_INTENSITY_OFF}
        />
        <Suspense fallback={null}>
          {DARK_MODEL_PATHS.map((path) => (
            <OfficeModel key={path} path={path} position={[0, 0, 0]} />
          ))}
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
