import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function Scene3D() {
  return (
    <Canvas>
      <OrbitControls></OrbitControls>
      <ambientLight></ambientLight>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </Canvas>
  );
}
