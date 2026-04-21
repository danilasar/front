import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { SettingsState } from "./types";

const initialState: SettingsState = {
  isLoading: false,
  isErrorModalOpen: false,
  error: null,
}

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    startLoading: (state) => {
      state.isLoading = true;
    },
    stopLoading: (state) => {
      state.isLoading = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isErrorModalOpen = true;
    },
    clearError: (state) => {
      state.error = null;
      state.isErrorModalOpen = false;
    }
  },
})

export default settingsSlice.reducer;
export const { startLoading, stopLoading, setError, clearError } = settingsSlice.actions;
