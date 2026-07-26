import { SCENE_OBJECT_IDS, type SceneObjectData } from "../data/objects";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setHovered, setSelected, toggleLights } from "../store/sceneSlice";

interface DeskObjectProps {
  data: SceneObjectData;
}

export default function DeskObject({ data }: DeskObjectProps) {
  const dispatch = useAppDispatch();
  const isHighlighted = useAppSelector(
    (state) => state.scene.hoveredId === data.id,
  );

  const onObjectClick = () => {
    dispatch(setSelected(data.id));
    if (data.id === SCENE_OBJECT_IDS.LAMP) {
      dispatch(toggleLights());
    }
    // Touch has no reliable "pointer left the mesh" event the way a mouse
    // does, so a tap can leave hoveredId (and the glow it drives) stuck on.
    // Clearing it explicitly on click/tap is a safety net for that case.
    dispatch(setHovered(null));
    document.body.style.cursor = "auto";
  };
  return (
    <mesh
      position={data.position}
      onPointerOver={() => {
        dispatch(setHovered(data.id));
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        dispatch(setHovered(null));
        document.body.style.cursor = "auto";
      }}
      onClick={onObjectClick}
    >
      {data.geometry === "box" && (
        <boxGeometry args={data.args as [number, number, number]} />
      )}
      {data.geometry === "cylinder" && (
        <cylinderGeometry
          args={data.args as [number, number, number, number]}
        />
      )}
      {data.geometry === "cone" && (
        <coneGeometry args={data.args as [number, number, number]} />
      )}
      <meshStandardMaterial
        color={data.color}
        emissive={isHighlighted ? "#cdde35" : "#000000"}
        emissiveIntensity={isHighlighted ? 0.6 : 0}
      />
    </mesh>
  );
}
