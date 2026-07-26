import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { SectionId } from "../data/navigation";
import {
  CONTACT,
  EXPERIENCE,
  PROFILE,
  PROJECTS,
  SKILLS,
} from "../data/portfolio";
import "./SidePanel.css";

/**
 * Sections come from the route table now — the panel shows whatever the
 * URL says. Null is the extra case routing doesn't have: "closed".
 */
export type PanelId = SectionId | null;

interface SidePanelProps {
  activePanel: PanelId;
  onClose: () => void;
}

// Single source of truth for the slide duration: passed to CSS below as a
// custom property, so the JS timing and the CSS transition can't drift
// apart the way two hardcoded numbers would.
const PANEL_TRANSITION_MS = 1000;

/** Shared by both list sections — same visual treatment, different source. */
function TagRow({ tags }: { tags: string[] }) {
  return (
    <ul className="entry__tags">
      {tags.map((tag) => (
        <li key={tag} className="entry__tag">
          {tag}
        </li>
      ))}
    </ul>
  );
}

function AboutSection() {
  return (
    <>
      {/* The name itself is the 3D title filling the scene behind this
          panel, so repeating it here would be the third time it appears
          on screen. Role and location are the parts that aren't already
          said. */}
      <p className="about__role">{PROFILE.title}</p>
      <p className="about__location">{PROFILE.location}</p>
      <p className="panel-blurb">{PROFILE.bio}</p>

      <div className="skills">
        {SKILLS.map((group) => (
          <section key={group.group} className="skills__group">
            <h3 className="skills__heading">{group.group}</h3>
            {/* Same pill treatment as the experience and project tags —
                one visual language for "a list of technologies". */}
            <TagRow tags={group.items} />
          </section>
        ))}
      </div>
    </>
  );
}

function ExperienceList() {
  return (
    <ol className="entry-list">
      {EXPERIENCE.map((role) => (
        <li key={role.company} className="entry">
          <span
            className={`entry__period ${
              role.current ? "entry__period--current" : ""
            }`}
          >
            {role.period}
          </span>
          <h3 className="entry__title">{role.company}</h3>
          <p className="entry__meta">
            {role.role} · {role.location}
          </p>
          <ul className="entry__points">
            {role.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <TagRow tags={role.tags} />
        </li>
      ))}
    </ol>
  );
}

function ProjectList() {
  return (
    <ol className="entry-list">
      {PROJECTS.map((project) => (
        <li key={project.id} className="entry">
          {project.status && (
            <span className="entry__period entry__period--current">
              {project.status}
            </span>
          )}
          <h3 className="entry__title">
            {project.title}
            {project.kind && (
              <span className="entry__kind"> — {project.kind}</span>
            )}
          </h3>
          <p className="entry__meta">{project.description}</p>
          {/* Not every project has bullets (Sixthhive is a one-liner), and
              an empty <ul> would still take up its margin. */}
          {project.highlights.length > 0 && (
            <ul className="entry__points">
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          )}
          <TagRow tags={project.tags} />
          {project.liveUrl && (
            <a
              className="entry__link"
              href={project.liveUrl}
              // Leaving the page would tear down the whole scene — and
              // noopener stops the opened tab reaching back via
              // window.opener.
              target="_blank"
              rel="noopener noreferrer"
            >
              {project.linkLabel ?? "Visit site"} ↗
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

function ContactList() {
  return (
    <>
      <p className="panel-blurb">{CONTACT.blurb}</p>
      <ul className="contact-list">
        <li className="contact-list__row">
          <span className="contact-list__label">Email</span>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </li>
        <li className="contact-list__row">
          <span className="contact-list__label">Phone</span>
          <a href={CONTACT.phone.link}>{CONTACT.phone.display}</a>
        </li>
        {CONTACT.socials.map((social) => (
          <li key={social.name} className="contact-list__row">
            <span className="contact-list__label">{social.name}</span>
            <a href={social.href} target="_blank" rel="noopener noreferrer">
              {/* The bare handle reads better than the full URL in a
                  380px-wide panel. */}
              {social.href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

const PANEL_CONTENT: Record<
  Exclude<PanelId, null>,
  { title: string; body: ReactNode }
> = {
  about: { title: "About", body: <AboutSection /> },
  experience: { title: "Experience", body: <ExperienceList /> },
  projects: { title: "Projects", body: <ProjectList /> },
  contact: { title: "Contact", body: <ContactList /> },
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
