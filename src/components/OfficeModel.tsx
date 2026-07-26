import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { KTX2Loader } from "three-stdlib";

interface OfficeModelProps {
  path: string;
  position?: [number, number, number];
}

// Shared across every <OfficeModel>, same pattern drei itself uses
// internally for its DRACOLoader singleton — no reason to build a fresh
// KTX2Loader (and re-fetch its transcoder) per model.
let ktx2Loader: KTX2Loader | null = null;

export default function OfficeModel({ path, position }: OfficeModelProps) {
  const gl = useThree((state) => state.gl);

  const { scene } = useGLTF(path, true, true, (loader) => {
    // Some of these Sketchfab exports use KTX2-compressed textures, which
    // drei's useGLTF doesn't configure automatically the way it does for
    // Draco geometry compression — has to be wired in by hand here.
    if (!ktx2Loader) {
      ktx2Loader = new KTX2Loader().setTranscoderPath("/basis/");
    }
    ktx2Loader.detectSupport(gl);
    loader.setKTX2Loader(ktx2Loader);
  });

  // <primitive> renders an already-built Three.js object as-is, instead
  // of constructing a new one from JSX props the way <mesh> etc. do.
  // position is just an ordinary prop on the underlying Object3D, same
  // as on <mesh>.
  return <primitive object={scene} position={position} />;
}
