import type { ReactNode } from "react";
import { useEffect } from "react";
import { matchPath, Navigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import type { RootState } from "../../store";
import type { Role } from "../../domain/types";
import { routes } from "../../routes";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { restoreAuth } from "../../store/auth";

type AuthRouteMode = "guest" | "user" | "private";

type AuthWrapperProps = {
  children: ReactNode;
};

type MatchedRouteAccess = {
  mode: AuthRouteMode;
  roles?: Role[];
};

const getMatchedRouteAccess = (pathname: string): MatchedRouteAccess => {
  const matchedRoute = routes.find((route) =>
    matchPath({ path: route.path, end: true }, pathname),
  );

  if (!matchedRoute) {
    return { mode: "user" };
  }

  if (matchedRoute.isGuest) {
    return { mode: "guest" };
  }

  if (matchedRoute.isPrivate) {
    return {
      mode: "private",
      roles: matchedRoute.roles,
    };
  }

  return { mode: "user" };
};

const AuthLoader = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
      Проверяем авторизацию...
    </div>
  </div>
);

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthInitialized, isAuth, user } = useAppSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (isAuthInitialized) {
      return;
    }

    void dispatch(restoreAuth());
  }, [dispatch, isAuthInitialized]);

  const currentRouteAccess = getMatchedRouteAccess(location.pathname);

  if (currentRouteAccess.mode === "user") {
    return <>{children}</>;
  }

  if (!isAuthInitialized) {
    return <AuthLoader />;
  }

  if (currentRouteAccess.mode === "guest") {
    if (isAuth) {
      return <Navigate replace to="/profile" />;
    }

    return <>{children}</>;
  }

  if (!isAuth) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (
    currentRouteAccess.roles !== undefined
    && (!user || !currentRouteAccess.roles.includes(user.role))
  ) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка доступа</AlertTitle>
        <AlertDescription>Недостаточно прав для просмотра страницы</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};
