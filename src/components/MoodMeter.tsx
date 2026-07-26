import type { CSSProperties } from "react";
import { moodFor, moodProgress } from "../data/moods";
import { useAppSelector } from "../store/hooks";
import "./MoodMeter.css";

export default function MoodMeter() {
  // A single number is the entire subscription. Selecting the whole
  // `state.scene` object instead would re-render this on every hover
  // change too, since useSelector compares by reference by default.
  const impacts = useAppSelector((state) => state.scene.moodImpacts);

  // Derived in render, not stored. Nothing here needs to survive a
  // re-render, so useState/useMemo would only add ways to go stale.
  const mood = moodFor(impacts);
  const progress = moodProgress(impacts);
  const isActive = impacts > 0;

  return (
    <div
      className={`mood-meter ${isActive ? "mood-meter--active" : ""}`}
      // The tier's colour reaches the fill, the glow and the face's halo
      // through one custom property — one value in, three uses out, all
      // transitionable by CSS.
      style={{ "--mood-color": mood.color } as CSSProperties}
      // Kept mounted and faded rather than conditionally rendered, so the
      // bar can animate its first fill instead of popping in already full.
      aria-hidden={!isActive}
    >
      <span
        // Re-keying on the count remounts the span, which restarts the CSS
        // pop animation. A class toggle wouldn't — the browser only replays
        // an animation when the element is new or the animation changes.
        key={impacts}
        className="mood-meter__face"
      >
        {mood.face}
      </span>

      <div className="mood-meter__body">
        {/* Politely announced rather than assertive: it's flavour, and it
            shouldn't interrupt whatever a screen reader is mid-sentence on. */}
        <span className="mood-meter__label" aria-live="polite">
          {mood.label}
        </span>
        <div
          className="mood-meter__track"
          role="meter"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Patience"
        >
          <div
            className="mood-meter__fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
