import type { PanelId } from "./SidePanel";
import "./PageNav.css";

interface PageNavProps {
  activePanel: PanelId;
  onSelect: (panel: PanelId) => void;
}

const NAV_ITEMS: { id: Exclude<PanelId, null>; label: string }[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export default function PageNav({ activePanel, onSelect }: PageNavProps) {
  return (
    <nav className="page-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`page-nav__button ${
            activePanel === item.id ? "page-nav__button--active" : ""
          }`}
          onClick={() => onSelect(activePanel === item.id ? null : item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
