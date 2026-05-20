import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../../domain/types";
import { useAppSelector } from "../../store/hooks";

export const RoleWrapper = ({ roles }: { roles: Role[] }) => {
  const { isAuth, user } = useAppSelector((state) => state.auth);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка доступа</AlertTitle>
        <AlertDescription>Недостаточно прав для просмотра страницы</AlertDescription>
      </Alert>
    );
  }

  return <Outlet />;
};
