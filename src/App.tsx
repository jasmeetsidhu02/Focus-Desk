import { Leva } from "leva";
import { useLocation, useNavigate } from "react-router";
// import MoodMeter from "./components/MoodMeter";
import PageNav from "./components/PageNav";
import Scene3D from "./components/Scene3D";
import SidePanel from "./components/SidePanel";
import { sectionForPath, stationForPath } from "./data/navigation";
import { useSceneReady } from "./hooks/useSceneReady";
import "./App.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const sceneReady = useSceneReady();

  /**
   * The URL is the state now — there's no `activePanel` useState any more.
   * Which section is open, which nav item is lit, and where the camera
   * stands are all derived from one string, so they can't disagree.
   */
  const section = sectionForPath(location.pathname);
  const station = stationForPath(location.pathname);

  return (
    <>
      {/* Deliberately outside .scene-layer: that wrapper gets a CSS blur
          filter when a panel opens, which would blur the debug panel too.
          Dev-only — in a production build the controls still resolve to
          their defaults, they just aren't adjustable. */}
      <Leva hidden={!import.meta.env.DEV} collapsed />

      {/* Scene3D sits *outside* any route-switched subtree on purpose.
          The room is ~18MB of GLB and the physics world holds live state;
          rendering it inside a <Routes> would tear down the WebGL context
          and reload every model on each navigation. Routes move the
          camera instead — nothing about the scene remounts. */}
      <div className={`scene-layer ${section ? "scene-layer--dimmed" : ""}`}>
        <Scene3D station={station} />
      </div>

      {/* Also outside .scene-layer, for the same reason as <Leva> above:
          it's chrome sitting *over* the scene, so it shouldn't be blurred
          along with it when a panel opens. */}
      {/* <MoodMeter /> */}

      {/* Held back until the room has loaded. drei's <Loader /> renders
          *inside* .scene-layer, and `position: fixed` makes that wrapper
          its own stacking context — so the loader's z-index: 1000 is
          trapped in there and this nav's z-index: 30 paints straight over
          it. Gating on load is the fix; raising the loader's z-index
          wouldn't help, because the two aren't being compared. */}
      {sceneReady && <PageNav activeSection={section} />}

      {/* Note this isn't route-switched either. SidePanel animates itself
          shut over ~1s and needs to stay mounted (with its old content)
          for the whole slide-out; a <Route> would unmount it the instant
          the URL changed and the panel would vanish rather than leave. */}
      <SidePanel activePanel={section} onClose={() => navigate("/")} />
    </>
  );
}

export default App;
