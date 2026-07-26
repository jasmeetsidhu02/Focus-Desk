import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MOOD_CALM_AMOUNT, MOOD_MAX } from "../data/moods";

interface SceneState {
  hoveredId: string | null;
  selectedId: string | null;
  lightsOn: boolean;
  /**
   * Cumulative letters that have hit the floor this session.
   *
   * Only a count lives here — the label, face, colour and shake strength
   * are all derived from it via the MOODS table. Storing the *derived*
   * mood too would be two sources of truth that can drift apart.
   *
   * This belongs in Redux (unlike the camera-shake trauma, which is a ref)
   * because it changes rarely, and every change is meant to re-render the
   * meter. Per-frame values are exactly the ones that must stay out.
   */
  moodImpacts: number;
}

const initialState: SceneState = {
  hoveredId: null,
  selectedId: null,
  lightsOn: true,
  moodImpacts: 0,
};

const sceneSlice = createSlice({
  name: "scene",
  initialState,
  reducers: {
    setHovered(state, action: PayloadAction<string | null>) {
      state.hoveredId = action.payload;
    },
    setSelected(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    toggleLights(state) {
      state.lightsOn = !state.lightsOn;
    },
    /** One letter hit the floor. Clamped so the meter can't overfill. */
    registerImpact(state) {
      state.moodImpacts = Math.min(MOOD_MAX, state.moodImpacts + 1);
    },
    /** The title has been put back together — take some of it back. */
    calmMood(state) {
      state.moodImpacts = Math.max(0, state.moodImpacts - MOOD_CALM_AMOUNT);
    },
  },
});

export const {
  setHovered,
  setSelected,
  toggleLights,
  registerImpact,
  calmMood,
} = sceneSlice.actions;
export default sceneSlice.reducer;
