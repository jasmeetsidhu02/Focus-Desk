import { Link } from "react-router";
import { NAV_ROUTES, type SectionId } from "../data/navigation";
import "./PageNav.css";

interface PageNavProps {
  activeSection: SectionId | null;
}

export default function PageNav({ activeSection }: PageNavProps) {
  return (
    <nav className="page-nav" aria-label="Sections">
      {NAV_ROUTES.map((route) => {
        const isActive = activeSection === route.section;

        return (
          <Link
            key={route.section}
            // Clicking the open section closes it, same as the old toggle
            // — it just navigates home instead of clearing a state field.
            to={isActive ? "/" : route.path}
            className={`page-nav__button ${
              isActive ? "page-nav__button--active" : ""
            }`}
            // A real <a> rather than a <button>: middle-click, cmd-click
            // and "copy link address" all work, and a screen reader
            // announces it as navigation, which is what it now is.
            aria-current={isActive ? "page" : undefined}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
