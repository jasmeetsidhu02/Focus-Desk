import { sceneObjects } from "../data/objects";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSelected, toggleLights } from "../store/sceneSlice";
import "./InfoPanel.css";

export default function InfoPanel() {
  const dispatch = useAppDispatch();

  const selectedId = useAppSelector((state) => state.scene.selectedId);

  const object = sceneObjects.find((sceneObject) => {
    return sceneObject.id === selectedId;
  });

  const isOpen = selectedId !== null;

  return (
    <aside className={`info-panel ${isOpen ? "info-panel--open" : ""}`}>
      <button
        className="info-panel__close"
        onClick={() => {
          dispatch(setSelected(null));
          dispatch(toggleLights());
        }}
        aria-label="Close"
      >
        ×
      </button>
      <div
        className="info-panel__accent"
        style={{ background: object?.color ?? "transparent" }}
      />
      <h2 className="info-panel__title">{object?.label}</h2>
      <p className="info-panel__description">{object?.description}</p>
    </aside>
  );
}
