import type { RootState } from "../../store";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useEffect, useRef, type ReactNode } from "react";
import { restoreAuth } from "../../store/auth";

export const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const { isAuthInitialized } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const tryInitRefresh = async () => {
      if (!isAuthInitialized) {
        await dispatch(restoreAuth());
      }
    }
    tryInitRefresh()
  }, [dispatch, isAuthInitialized]);

  return children;
};
