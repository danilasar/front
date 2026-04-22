import { Link } from "react-router-dom";
import { navRouters } from "../routes";
import { useContext } from "react";
import { ColorModeContext } from "../themeModeContext";
import { Moon, Sun } from "lucide-react";
import { useAppSelector } from "../store/hooks";
import Icon from "../assets/icon.svg?react";
import { Button } from "./ui/button";

export default function NavBar() {
  const { darkMode, toggleTheme } = useContext(ColorModeContext);
  const { isAuth, user } = useAppSelector((state) => state.auth);

  const visibleRoutes = navRouters.filter((route) => {
    if (route.isPrivate && !isAuth) return false;
    if (route.roles && (!user || !route.roles.includes(user.role))) return false;
    return route.inNav !== false;
  });

  return (
    <div className="fixed left-1/2 top-3 z-50 w-[min(1120px,calc(100vw-24px))] -translate-x-1/2 sm:top-5">
      <div className="aero-nav rounded-lg border border-white/70 px-2 backdrop-blur-2xl dark:border-white/10">
        <div className="flex min-h-14 items-center gap-4 overflow-x-auto px-2 sm:px-4">
          <Link to="/" className="mr-1 flex flex-shrink-0 items-center gap-2 pr-2">
            <Icon className="h-8 w-8 text-primary" />
            <span className="hidden text-sm font-bold tracking-normal sm:inline">HackFlow</span>
          </Link>
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
            className="aero-button aero-button-secondary ml-auto inline-flex h-10 w-10 flex-shrink-0 items-center justify-center text-foreground"
            title={darkMode ? "Светлая тема" : "Темная тема"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
