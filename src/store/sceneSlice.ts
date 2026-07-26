import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SceneState {
  hoveredId: string | null;
  selectedId: string | null;
  lightsOn: boolean;
}

const initialState: SceneState = {
  hoveredId: null,
  selectedId: null,
  lightsOn: true,
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
  },
});

export const { setHovered, setSelected, toggleLights } = sceneSlice.actions;
export default sceneSlice.reducer;
