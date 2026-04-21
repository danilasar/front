import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FormField, Hackathon } from "../../domain/types";
import type { HackathonsState } from "./types";

const initialState: HackathonsState = {
  items: [],
  active: null,
  current: null,
  fields: [],
};

const hackathonsSlice = createSlice({
  name: "hackathons",
  initialState,
  reducers: {
    setHackathons: (state, action: PayloadAction<Hackathon[]>) => {
      state.items = action.payload;
    },
    setActiveHackathon: (state, action: PayloadAction<Hackathon | null>) => {
      state.active = action.payload;
    },
    setCurrentHackathon: (state, action: PayloadAction<Hackathon | null>) => {
      state.current = action.payload;
    },
    upsertHackathon: (state, action: PayloadAction<Hackathon>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index === -1) {
        state.items.unshift(action.payload);
      } else {
        state.items[index] = action.payload;
      }
      if (state.current?.id === action.payload.id) state.current = action.payload;
      if (state.active?.id === action.payload.id) state.active = action.payload;
    },
    setFormFields: (state, action: PayloadAction<FormField[]>) => {
      state.fields = action.payload;
    },
  },
});

export const {
  setActiveHackathon,
  setCurrentHackathon,
  setFormFields,
  setHackathons,
  upsertHackathon,
} = hackathonsSlice.actions;
export default hackathonsSlice.reducer;
