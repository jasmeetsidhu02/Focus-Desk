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
