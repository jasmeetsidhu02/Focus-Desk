/**
 * A letter that has been knocked out of the title and handed over to the
 * physics world.
 *
 * Position/rotation are captured in *world* space at the moment of the
 * click, because the title itself lives inside animated groups (placement,
 * idle float, entrance rise). A rigid body has to be a sibling of those
 * groups rather than a child — otherwise the parent transforms would fight
 * the physics simulation for control of the same object.
 */
export interface FallenLetter {
  /** Index into the title's letter layout. */
  id: number;
  char: string;
  size: number;
  /**
   * The letter's x offset *within* the title group. The slot it flies back
   * to has to be recomputed in world space every frame, because the title
   * is still drifting with the idle float and cursor parallax while the
   * letters are returning.
   */
  slotX: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  /**
   * The initial toss, randomised once when the letter is knocked out.
   *
   * These have to be stored rather than generated in render: Rapier
   * re-applies its velocity props whenever they change, so calling
   * Math.random() inline in the JSX would re-kick every resting letter on
   * every re-render — which reads as a permanent jitter.
   */
  linearVelocity: [number, number, number];
  angularVelocity: [number, number, number];
}

/**
 * A one-shot emoji reaction, spawned where a letter landed.
 *
 * Deliberately *not* in Redux: these are short-lived visual confetti that
 * exist for about a second and are identified only by a throwaway id.
 * Redux is for state other parts of the app need to read — the mood counter
 * qualifies, a list of in-flight emoji does not.
 */
export interface ImpactBubble {
  /** Monotonic, not the letter's id — the same letter can be hit twice
   *  before the first bubble has expired, and React keys must be unique. */
  id: number;
  emoji: string;
  /** World-space, captured at the moment of the collision. */
  position: [number, number, number];
}
