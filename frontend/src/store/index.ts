import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./settings/slice"
import authReducer from "./auth/slice";
import hackathonsReducer from "./hackathons/slice";
import teamsReducer from "./teams/slice";
import adminReducer from "./admin/slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    hackathons: hackathonsReducer,
    teams: teamsReducer,
    admin: adminReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
