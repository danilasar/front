import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "../../domain/types";
import type { AuthState } from "./types";

const initialState: AuthState = {
  user: null,
  isAuth: false,
  isUserLoaded: false,
  isAuthInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuth = true;
      state.isUserLoaded = true;
      state.isAuthInitialized = true;
    },
    authFailed: (state) => {
      state.user = null;
      state.isAuth = false;
      state.isUserLoaded = false;
      state.isAuthInitialized = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuth = false;
      state.isUserLoaded = false;
      state.isAuthInitialized = true;
    },
  },
});

export const { authSuccess, authFailed, clearAuth } = authSlice.actions;
export default authSlice.reducer;
