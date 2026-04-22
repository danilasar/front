import { Link } from "react-router-dom";
import { navRouters } from "../routes";
import { useContext } from "react";
import { ColorModeContext } from "../themeModeContext";
import { Moon, Sun } from "lucide-react";
import { useAppSelector } from "../store/hooks";
import Icon from "../assets/icon.svg?react";
import { Button } from "./ui/button";

export default function NavBar() {
  const { toggleTheme } = useContext(ColorModeContext);
  const { isAuth, user } = useAppSelector((state) => state.auth);
  const isDark = document.documentElement.classList.contains("dark");

  const visibleRoutes = navRouters.filter((route) => {
    if (route.isPrivate && !isAuth) return false;
    if (route.roles && (!user || !route.roles.includes(user.role))) return false;
    return route.inNav !== false;
  });

  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-4 sm:top-5 z-50 w-min(1120px, calc(100vw - 24px))">
      <div className="rounded-lg bg-white/58 dark:bg-slate-950/70 border border-white/70 dark:border-white/20 shadow-lg backdrop-blur-2xl px-2">
        <div className="flex gap-1 items-center min-h-14 px-2 sm:px-4 overflow-x-auto">
          <Icon className="w-8 h-8 flex-shrink-0 text-green-500 dark:text-green-400" />
          {visibleRoutes.map((route) => (
            <Button
              key={route.path}
              asChild
              variant="ghost"
              className="whitespace-nowrap"
            >
              <Link to={route.path}>
                {route.label}
              </Link>
            </Button>
          ))}
          {!isAuth && (
            <Button asChild variant="ghost">
              <Link to="/login">
                Войти
              </Link>
            </Button>
          )}
          <button 
            onClick={toggleTheme}
            className="ml-auto p-2 rounded-md hover:bg-accent"
            title={isDark ? "Светлая тема" : "Темная тема"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
