import { Leva } from "leva";
import { useState } from "react";
import PageNav from "./components/PageNav";
import Scene3D from "./components/Scene3D";
import SidePanel, { type PanelId } from "./components/SidePanel";
import "./App.css";

function App() {
  const [activePanel, setActivePanel] = useState<PanelId>(null);

  return (
    <>
      {/* Deliberately outside .scene-layer: that wrapper gets a CSS blur
          filter when a panel opens, which would blur the debug panel too.
          Dev-only — in a production build the controls still resolve to
          their defaults, they just aren't adjustable. */}
      <Leva hidden={!import.meta.env.DEV} collapsed />

      <div
        className={`scene-layer ${activePanel ? "scene-layer--dimmed" : ""}`}
      >
        <Scene3D />
      </div>
      <PageNav activePanel={activePanel} onSelect={setActivePanel} />
      <SidePanel
        activePanel={activePanel}
        onClose={() => setActivePanel(null)}
      />
    </>
  );
}

export default App;
