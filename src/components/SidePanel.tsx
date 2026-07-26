import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import "./SidePanel.css";

export type PanelId = "about" | "projects" | "contact" | null;

interface SidePanelProps {
  activePanel: PanelId;
  onClose: () => void;
}

// Single source of truth for the slide duration: passed to CSS below as a
// custom property, so the JS timing and the CSS transition can't drift
// apart the way two hardcoded numbers would.
const PANEL_TRANSITION_MS = 1000;

const PANEL_CONTENT: Record<
  Exclude<PanelId, null>,
  { title: string; body: ReactNode }
> = {
  about: {
    title: "About",
    body: (
      <p>
        {/* TODO: replace with your real bio */}
        Placeholder bio — React/frontend developer building this scene to
        learn React Three Fiber, Redux Toolkit, and the imperative/declarative
        bridge between React and Three.js.
      </p>
    ),
  },
  projects: {
    title: "Projects",
    body: (
      <ul>
        <li>
          <strong>Focus Desk</strong> — this scene: an interactive 3D
          portfolio built with React, TypeScript, React Three Fiber, and
          Redux Toolkit.
        </li>
        <li>{/* TODO: add another real project here */}</li>
      </ul>
    ),
  },
  contact: {
    title: "Contact",
    body: (
      <p>
        {/* TODO: confirm/replace contact details */}
        Email: <a href="mailto:jasmeetai02@gmail.com">jasmeetai02@gmail.com</a>
        <br />
        GitHub: <a href="https://github.com/jasmeetsidhu02">jasmeetsidhu02</a>
      </p>
    ),
  },
};

export default function SidePanel({ activePanel, onClose }: SidePanelProps) {
  // `activePanel` is what's been *requested*; `displayedPanel` is whose
  // content is actually rendered right now. They diverge during the
  // close→reopen handoff: when switching sections, the panel finishes
  // sliding out with the *old* content still in place before the new
  // content swaps in.
  const [displayedPanel, setDisplayedPanel] = useState<PanelId>(activePanel);

  // Derived, not stored — the panel is open exactly when a section is
  // requested and its content has caught up. During a switch these
  // disagree for one transition, which is what drives the slide-out.
  const isOpen = activePanel !== null && activePanel === displayedPanel;

  useEffect(() => {
    if (activePanel === displayedPanel) return;

    // Nothing on screen yet, so there's no close animation to wait for.
    // (Still deferred rather than set synchronously: a setState directly
    // in an effect body triggers a cascading render.)
    const delay = displayedPanel === null ? 0 : PANEL_TRANSITION_MS;

    const timer = setTimeout(() => setDisplayedPanel(activePanel), delay);

    // Cleanup matters here: clicking another section mid-animation re-runs
    // this effect, and without clearing the pending timer the old one
    // would still fire and stomp the newer selection.
    return () => clearTimeout(timer);
  }, [activePanel, displayedPanel]);

  const content = displayedPanel ? PANEL_CONTENT[displayedPanel] : null;

  return (
    <aside
      className={`side-panel ${isOpen ? "side-panel--open" : ""}`}
      style={
        { "--panel-transition": `${PANEL_TRANSITION_MS}ms` } as CSSProperties
      }
      aria-hidden={!isOpen}
    >
      <button
        className="side-panel__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <h2 className="side-panel__title">{content?.title}</h2>
      <div className="side-panel__body">{content?.body}</div>
    </aside>
  );
}
