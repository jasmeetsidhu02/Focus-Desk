/**
 * The escalation ladder for knocking letters out of the title.
 *
 * Static data, not state — the only thing that actually lives in the store
 * is a single number (how many letters have hit the floor this session).
 * Which tier that number lands in, what face it wears, how hard the camera
 * shakes: all derived from this table. Same principle as the scene objects
 * in the original plan — if it never changes at runtime, it isn't state.
 */
export interface Mood {
  /** Cumulative impacts at which this tier takes over. Ascending. */
  threshold: number;
  label: string;
  /** The face shown in the meter while this tier is current. */
  face: string;
  /** Pool the impact bubbles draw from at this tier. */
  reactions: string[];
  /** Meter fill colour — cool and calm through to angry red. */
  color: string;
  /**
   * Multiplier on the camera shake produced when a letter is knocked
   * loose at this tier. 1 is the base jolt, 2 is twice as violent.
   *
   * Careful with 0 — it's a bare multiplier, so a single zero switches
   * shake off entirely for that tier rather than just flattening the
   * escalation.
   */
  shake: number;
}

export const MOODS: Mood[] = [
  {
    threshold: 0,
    label: "Unbothered",
    face: "🙂",
    reactions: ["😮", "🙃", "😯"],
    color: "#8fb6ff",
    shake: 1,
  },
  {
    threshold: 1,
    label: "Noted.",
    face: "😐",
    reactions: ["😐", "😑", "🫠"],
    color: "#b9a6ff",
    shake: 1,
  },
  {
    threshold: 3,
    label: "Okay, very funny",
    face: "😒",
    reactions: ["😒", "🙄", "😬"],
    color: "#e0a3ff",
    shake: 1.5,
  },
  {
    threshold: 5,
    label: "Please stop",
    face: "😟",
    reactions: ["😟", "😨", "😵‍💫"],
    color: "#ffb37a",
    shake: 1.5,
  },
  {
    threshold: 8,
    label: "Seriously?!",
    face: "😠",
    reactions: ["😠", "💢", "😤"],
    color: "#ff8a5c",
    shake: 2,
  },
  {
    threshold: 12,
    label: "Unforgivable",
    face: "🤬",
    reactions: ["🤬", "💥", "🔥"],
    color: "#ff5f56",
    shake: 2,
  },
];

/**
 * The top of the ladder — also the cap the store clamps to, so the meter
 * can't overfill and so calming down after a rebuild always means something.
 */
export const MOOD_MAX = MOODS[MOODS.length - 1].threshold;

/** How much a full rebuild takes off the counter. Deliberately less than */
/** it took to get there: the annoyance is sticky, not erased. */
export const MOOD_CALM_AMOUNT = 2;

/** The highest tier this many impacts has unlocked. */
export function moodFor(impacts: number): Mood {
  // Walk down from the top so the *last* qualifying tier wins.
  for (let i = MOODS.length - 1; i >= 0; i--) {
    if (impacts >= MOODS[i].threshold) return MOODS[i];
  }
  return MOODS[0];
}

/** 0–1, for the meter's fill width. */
export function moodProgress(impacts: number): number {
  return Math.min(1, Math.max(0, impacts / MOOD_MAX));
}
