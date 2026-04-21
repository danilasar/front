import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { UserState } from "./types"
import type { User } from "../../entities/user/types"

const initialState: UserState = {
  user: null,
  isAuth: false,
  isUserLoaded: false,
  isAuthInitialized: false
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    authSuccess: (state) => {
      state.isAuth = true;
      state.isUserLoaded = false;
      state.isAuthInitialized = true;
    },

    authFailed: (state) => {
      state.isAuth = false;
      state.isUserLoaded = false;
      state.isAuthInitialized = true;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isUserLoaded = true;
      state.isAuth = true;
      state.isAuthInitialized = true;
    },

    clearUser: (state) => {
      state.user = null;
      state.isUserLoaded = false;
      state.isAuth = false;
      state.isAuthInitialized = true;
    },
  },
})

export const { authSuccess, authFailed, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
