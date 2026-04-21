import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "../../store";

export const GuestWrapper = () => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);

  if (isAuth) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};
