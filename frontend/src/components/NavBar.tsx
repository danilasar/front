import { AppBar, Toolbar, Button, Box, useTheme, IconButton, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";
import { navRouters } from "../routes";
import { useContext } from "react";
import { ColorModeContext } from "../themeModeContext";
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import { useAppSelector } from "../store/hooks";

export default function NavBar() {
  const { toggleTheme } = useContext(ColorModeContext);
  const { isAuth, user } = useAppSelector((state) => state.auth);

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const visibleRoutes = navRouters.filter((route) => {
    if (route.isPrivate && !isAuth) return false;
    if (route.roles && (!user || !route.roles.includes(user.role))) return false;
    return route.inNav !== false;
  });

  return (
    <Box
      sx={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        top: "20px",
        zIndex: 1000
      }}
    >
      <AppBar
        position="static"
        sx={{
          borderRadius: "12px",
          background: theme.palette.background.paper,
          px: 0.5,
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {visibleRoutes.map((route) => (
            <Button
              key={route.path}
              component={Link}
              to={route.path}
              sx={{
                color: theme.palette.text.primary,
                background: theme.palette.background.paper
              }}
            >
              {route.label}
            </Button>
          ))}
          {!isAuth && (
            <Button component={Link} to="/login" sx={{ color: theme.palette.text.primary }}>
              Войти
            </Button>
          )}
          <Tooltip title={isDark ? "Светлая тема" : "Темная тема"}>
            <IconButton onClick={toggleTheme}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
