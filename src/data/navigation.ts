/**
 * The route table, and where the camera stands for each one.
 *
 * One source of truth for three things that must never disagree: the URL,
 * the nav button, and the camera. Adding a section here is the only edit
 * needed to make all three appear.
 */

export type SectionId = "about" | "experience" | "projects" | "contact";

/**
 * Where the camera moves for a section, expressed as an *offset* from the
 * leva-tuned home position rather than an absolute point in the room.
 *
 * Two reasons for offsets: dragging the home camera in the debug panel
 * still moves every station with it (absolute values would desync the
 * moment you re-tune home), and an offset can't accidentally place the
 * camera inside a wall the way a hand-typed world coordinate can.
 */
export interface CameraStation {
  positionOffset: [number, number, number];
  lookAtOffset: [number, number, number];
  /** Absolute, not an offset — lower reads as tighter and more intimate. */
  fov: number;
}

/** The resting shot: no offset at all, straight off the debug panel. */
export const HOME_STATION: CameraStation = {
  positionOffset: [0, 0, 0],
  lookAtOffset: [0, 0, 0],
  fov: 45,
};

export interface RouteDef {
  path: string;
  label: string;
  section: SectionId;
  station: CameraStation;
}

/**
 * Positive x on `positionOffset` pushes the camera right, which slides the
 * subject *left* on screen — out from behind the panel that's covering the
 * right edge. Every station leans that way for that reason.
 *
 * These are starting values, not final ones. They're deliberately modest
 * (under ~3 units from a camera that sits 6 back) so nothing can end up
 * inside the room geometry — tune them against the real scene.
 */
export const NAV_ROUTES: RouteDef[] = [
  {
    path: "/about",
    label: "About",
    section: "about",
    station: {
      positionOffset: [1.2, 0.2, -0.8],
      lookAtOffset: [0.4, 0.1, 0],
      fov: 40,
    },
  },
  {
    path: "/experience",
    label: "Experience",
    section: "experience",
    station: {
      positionOffset: [2.2, 0.6, -0.4],
      lookAtOffset: [1, 0.2, 0],
      fov: 42,
    },
  },
  {
    path: "/projects",
    label: "Projects",
    section: "projects",
    station: {
      positionOffset: [2.8, 0.1, 0.6],
      lookAtOffset: [1.4, -0.2, 0],
      fov: 46,
    },
  },
  {
    path: "/contact",
    label: "Contact",
    section: "contact",
    station: {
      positionOffset: [1, -0.3, -1.4],
      lookAtOffset: [0.3, -0.3, 0],
      fov: 38,
    },
  },
];

/**
 * Which section a URL belongs to, or null for home.
 *
 * Prefix-matched rather than compared for equality so that deeper URLs
 * under a section — /projects/raypto, once detail pages land — keep the
 * section highlighted and the camera parked where it already is.
 */
export function sectionForPath(pathname: string): SectionId | null {
  const match = NAV_ROUTES.find(
    (route) =>
      pathname === route.path || pathname.startsWith(`${route.path}/`),
  );
  return match ? match.section : null;
}

export function stationForPath(pathname: string): CameraStation {
  const match = NAV_ROUTES.find(
    (route) =>
      pathname === route.path || pathname.startsWith(`${route.path}/`),
  );
  return match ? match.station : HOME_STATION;
}
