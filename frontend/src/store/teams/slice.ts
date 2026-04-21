import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Team, TeamApplicationResponse } from "../../domain/types";
import type { TeamsState } from "./types";

const initialState: TeamsState = {
  items: [],
  lastInvitationLinks: [],
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
    setInvitationLinks: (state, action: PayloadAction<TeamApplicationResponse["invitationLinks"]>) => {
      state.lastInvitationLinks = action.payload;
    },
    clearInvitationLinks: (state) => {
      state.lastInvitationLinks = [];
    },
  },
});

export const { clearInvitationLinks, setInvitationLinks, setTeams, upsertTeam } = teamsSlice.actions;
export default teamsSlice.reducer;
