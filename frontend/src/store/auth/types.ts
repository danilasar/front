import type { UserProfile } from "../../domain/types";

export type AuthState = {
  user: UserProfile | null;
  isAuth: boolean;
  isUserLoaded: boolean;
  isAuthInitialized: boolean;
};
