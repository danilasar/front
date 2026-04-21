import type { User } from "../../entities/user/types"

export type UserState = {
  user: User | null,
  isAuth: boolean,
  isUserLoaded: boolean,
  isAuthInitialized: boolean
}
