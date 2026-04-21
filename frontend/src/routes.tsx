import AdminPanel from "./pages/AdminPanel";
import HackathonDetails from "./pages/HackathonDetails";
import Hackathons from "./pages/Hackathons";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Teams from "./pages/Teams";

export interface RouteConfig {
  label: string
  path: string
  element: React.ReactNode
  isPrivate?: boolean,
  isGuest?: boolean,
  roles?: Array<"admin" | "organizer" | "participant">,
  inNav?: boolean,
}

export const navRouters: RouteConfig[] = [
  { label: "Главная", path: "/", element: <Home /> },
  { label: "Хакатоны", path: "/hackathons", element: <Hackathons /> },
  { label: "Профиль", path: "/profile", element: <Profile />, isPrivate: true },
  { label: "Администрирование", path: "/admin", element: <AdminPanel />, isPrivate: true, roles: ["admin"] },
]

export const routes: RouteConfig[] = [
  { label: "Регистрация", path: "/register", element: <Register />, isGuest: true },
  { label: "Вход", path: "/login", element: <Login />, isGuest: true },
  { label: "Команды", path: "/hackathons/:hackathonId/teams", element: <Teams />, isPrivate: true, inNav: false },
  { label: "Хакатон", path: "/hackathons/:hackathonId", element: <HackathonDetails />, inNav: false },
  ...navRouters,
  { label: "404", path: "*", element: <NotFound />, inNav: false },
]
