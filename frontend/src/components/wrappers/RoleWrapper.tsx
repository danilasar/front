import { Alert } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../../domain/types";
import { useAppSelector } from "../../store/hooks";

export const RoleWrapper = ({ roles }: { roles: Role[] }) => {
  const { isAuth, user } = useAppSelector((state) => state.auth);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Alert severity="error">Недостаточно прав для просмотра страницы</Alert>;
  }

  return <Outlet />;
};
