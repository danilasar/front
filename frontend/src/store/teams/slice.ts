import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Team } from "../../domain/types";
import type { TeamsState } from "./types";

const initialState: TeamsState = {
  items: [],
};

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.items = action.payload;
    },
    upsertTeam: (state, action: PayloadAction<Team>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index === -1) {
        state.items.unshift(action.payload);
      } else {
        state.items[index] = action.payload;
      }
    },
  },
});

export const { setTeams, upsertTeam } = teamsSlice.actions;
export default teamsSlice.reducer;
