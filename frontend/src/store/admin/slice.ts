import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "../../domain/types";
import type { AdminState } from "./types";

const initialState: AdminState = {
  organizers: [],
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setOrganizers: (state, action: PayloadAction<UserProfile[]>) => {
      state.organizers = action.payload;
    },
    upsertOrganizer: (state, action: PayloadAction<UserProfile>) => {
      const index = state.organizers.findIndex((item) => item.id === action.payload.id);
      if (index === -1) {
        state.organizers.unshift(action.payload);
      } else {
        state.organizers[index] = action.payload;
      }
    },
  },
});

export const { setOrganizers, upsertOrganizer } = adminSlice.actions;
export default adminSlice.reducer;
